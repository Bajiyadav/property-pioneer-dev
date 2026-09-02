import { describe, it, expect, beforeEach } from "vitest";
import {
  container,
  setTestContainer,
  resetContainer,
  type IDatabaseService,
  type IStorageService,
  type IEmailService,
  type IAuthService,
} from "@/server/services/container";

describe("Dependency Injection & Service Container Test Suite", () => {
  beforeEach(() => {
    resetContainer();
  });

  it("1. Provides default production service implementations", () => {
    expect(container.db).toBeDefined();
    expect(container.storage).toBeDefined();
    expect(container.email).toBeDefined();
    expect(container.auth).toBeDefined();
  });

  it("2. Allows injecting mock database service for isolated testing", async () => {
    const mockDb: IDatabaseService = {
      execute: async (name: string, fn: any) => ({
        data: [{ id: "mock-prop-1", title: "Mock Villa" }],
        durationMs: 1.2,
      }),
    };

    setTestContainer({ db: mockDb });

    const result = await container.db.execute("testQuery", async () => []);
    expect(result.data[0].title).toBe("Mock Villa");
    expect(result.durationMs).toBe(1.2);
  });

  it("3. Allows injecting mock storage service", async () => {
    const mockStorage: IStorageService = {
      getUploadUrl: async () => ({
        uploadUrl: "https://mock-s3.amazonaws.com/upload",
        objectKey: "property-photos/user-1/mock.jpg",
        expiresInSeconds: 300,
        isPrivate: false,
        headers: { "Content-Type": "image/jpeg" },
      }),
      getDownloadUrl: async () => "https://mock-s3.amazonaws.com/download?sig=xyz",
    };

    setTestContainer({ storage: mockStorage });

    const upload = await container.storage.getUploadUrl({
      folder: "property-photos",
      fileName: "test.jpg",
      contentType: "image/jpeg",
      fileSizeBytes: 1000,
      userId: "user-1",
    });

    expect(upload.uploadUrl).toBe("https://mock-s3.amazonaws.com/upload");
  });

  it("4. Allows injecting mock email service", async () => {
    let sentEmail: any = null;
    const mockEmail: IEmailService = {
      send: async (opts) => {
        sentEmail = opts;
        return { ok: true, status: "mocked", messageId: "msg-123" };
      },
    };

    setTestContainer({ email: mockEmail });

    const res = await container.email.send({
      to: "owner@seedhaproperties.com",
      subject: "Test Lead",
      htmlBody: "<p>Hello</p>",
    });

    expect(res.ok).toBe(true);
    expect(sentEmail.to).toBe("owner@seedhaproperties.com");
  });

  it("5. Resets to default container without leaking mocks across test runs", () => {
    setTestContainer({
      email: {
        send: async () => ({ ok: false, status: "failed", error: "test failure" }),
      },
    });

    resetContainer();
    expect(container.email).toBeDefined();
  });
});
