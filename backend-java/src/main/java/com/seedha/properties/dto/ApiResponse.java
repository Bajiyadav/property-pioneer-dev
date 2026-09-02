package com.seedha.properties.dto;

public class ApiResponse<T> {

    private boolean ok;
    private T data;
    private String error;
    private Long count;

    public ApiResponse() {}

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setOk(true);
        resp.setData(data);
        return resp;
    }

    public static <T> ApiResponse<T> success(T data, long count) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setOk(true);
        resp.setData(data);
        resp.setCount(count);
        return resp;
    }

    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setOk(false);
        resp.setError(error);
        return resp;
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public Long getCount() { return count; }
    public void setCount(Long count) { this.count = count; }
}
