package com.seedha.properties.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateInternalNoteRequestDto {

    @NotBlank(message = "Note content cannot be blank")
    private String note;

    public CreateInternalNoteRequestDto() {}

    public CreateInternalNoteRequestDto(String note) {
        this.note = note;
    }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
