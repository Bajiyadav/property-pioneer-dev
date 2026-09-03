package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * ClamAV scanner over the clamd INSTREAM protocol.
 *
 * Self-hosted, free, and adequate — chosen over a paid SaaS scanner per the
 * services policy. clamd runs as a sidecar or a service on the private network;
 * this client streams the bytes to it and reads the verdict.
 *
 * Everything that can go wrong with an external process is treated as "not a
 * pass": a missing config, an unreachable socket, a timeout, or a malformed
 * reply all yield UNAVAILABLE/ERROR, never CLEAN. The caller decides whether
 * that blocks the upload (fail-closed) or defers it — this class never guesses
 * that an unscanned file is safe.
 *
 * The socket transport is injectable so the framing and verdict parsing are
 * unit-tested without a running clamd; see MalwareScanTests.
 */
@Service
public class ClamAvScanService implements MalwareScanService {

    private static final Logger log = LoggerFactory.getLogger(ClamAvScanService.class);

    /** clamd INSTREAM chunk size. 32 KiB is well under clamd's default StreamMaxLength framing. */
    private static final int CHUNK_SIZE = 32 * 1024;

    /** Transport seam: given the full INSTREAM request bytes, return clamd's raw reply. */
    @FunctionalInterface
    interface Transport {
        byte[] exchange(byte[] request) throws IOException;
    }

    private final boolean enabled;
    private final String host;
    private final int port;
    private final int timeoutMs;
    private final Transport transport;

    public ClamAvScanService() {
        this(false, "localhost", 3310, 10000, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ClamAvScanService(
            @Value("${seedha.files.clamav.enabled:false}") boolean enabled,
            @Value("${seedha.files.clamav.host:localhost}") String host,
            @Value("${seedha.files.clamav.port:3310}") int port,
            @Value("${seedha.files.clamav.timeout-ms:10000}") int timeoutMs) {
        this(enabled, host, port, timeoutMs, null);
    }

    /** Test constructor: supply a Transport to avoid a real socket. */
    public ClamAvScanService(boolean enabled, String host, int port, int timeoutMs, Transport transport) {
        this.enabled = enabled;
        this.host = host;
        this.port = port;
        this.timeoutMs = timeoutMs;
        this.transport = transport != null ? transport : this::socketExchange;
        if (enabled) {
            log.info("ClamAV scanning enabled against clamd at {}:{}", host, port);
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public ScanResult scan(byte[] content) {
        if (!enabled) {
            return ScanResult.unavailable();
        }
        if (content == null) {
            return ScanResult.error("no content");
        }
        try {
            byte[] reply = transport.exchange(buildInstreamRequest(content));
            return parseReply(new String(reply, StandardCharsets.UTF_8));
        } catch (IOException ex) {
            log.warn("ClamAV scan could not complete: {}", ex.getMessage());
            return ScanResult.error(ex.getMessage());
        }
    }

    /** zINSTREAM\0, then [4-byte big-endian length][chunk]..., then a zero-length terminator. */
    static byte[] buildInstreamRequest(byte[] content) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            out.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
            int offset = 0;
            while (offset < content.length) {
                int len = Math.min(CHUNK_SIZE, content.length - offset);
                out.write(intToBigEndian(len));
                out.write(content, offset, len);
                offset += len;
            }
            out.write(intToBigEndian(0)); // terminator
        } catch (IOException impossible) {
            throw new IllegalStateException(impossible);
        }
        return out.toByteArray();
    }

    /** Parses "stream: OK", "stream: Eicar-Test-Signature FOUND", or an ERROR reply. */
    static ScanResult parseReply(String reply) {
        if (reply == null) {
            return ScanResult.error("empty reply");
        }
        String trimmed = reply.replace("\0", "").trim();
        if (trimmed.endsWith("OK")) {
            return ScanResult.clean();
        }
        if (trimmed.contains("FOUND")) {
            String signature = trimmed;
            int colon = trimmed.indexOf(':');
            int found = trimmed.lastIndexOf("FOUND");
            if (colon >= 0 && found > colon) {
                signature = trimmed.substring(colon + 1, found).trim();
            }
            return ScanResult.infected(signature);
        }
        return ScanResult.error(trimmed.isEmpty() ? "unrecognized reply" : trimmed);
    }

    private static byte[] intToBigEndian(int value) {
        return new byte[] {
                (byte) (value >>> 24),
                (byte) (value >>> 16),
                (byte) (value >>> 8),
                (byte) value
        };
    }

    private byte[] socketExchange(byte[] request) throws IOException {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            socket.setSoTimeout(timeoutMs);
            try (OutputStream os = socket.getOutputStream(); InputStream is = socket.getInputStream()) {
                os.write(request);
                os.flush();
                ByteArrayOutputStream reply = new ByteArrayOutputStream();
                byte[] buf = new byte[256];
                int n;
                while ((n = is.read(buf)) != -1) {
                    reply.write(buf, 0, n);
                    if (reply.size() > 4096) break;
                }
                return reply.toByteArray();
            }
        }
    }
}
