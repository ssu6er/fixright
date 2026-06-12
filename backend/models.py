import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

PHONE_RE = re.compile(r"^[\d\s()+-]{7,25}$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

APPLIANCE_TYPES = {
    "refrigerator",
    "washing-machine",
    "dishwasher",
    "oven-stove",
    "dryer",
    "other",
}

BOOKING_STATUSES = {
    "new",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
}


class BookingRequest(BaseModel):
    """Request body for POST /api/bookings."""

    name: str = Field(..., min_length=2, max_length=120, examples=["Jan Kowalski"])
    phone: str = Field(..., examples=["+48 501 234 567"])
    email: str | None = Field(default=None, max_length=255, examples=["kontakt@example.com"])
    appliance_type: str = Field(..., examples=["washing-machine"])
    problem_description: str = Field(..., min_length=10, max_length=2000)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name cannot be empty")
        return stripped

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, value: str) -> str:
        stripped = value.strip()
        digits_only = re.sub(r"\D", "", stripped)
        if not PHONE_RE.match(stripped) or not 7 <= len(digits_only) <= 15:
            raise ValueError("enter a valid phone number")
        return stripped

    @field_validator("email")
    @classmethod
    def email_valid(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not EMAIL_RE.match(stripped):
            raise ValueError("enter a valid email address")
        return stripped

    @field_validator("appliance_type")
    @classmethod
    def appliance_type_valid(cls, value: str) -> str:
        stripped = value.strip()
        if stripped not in APPLIANCE_TYPES:
            raise ValueError("choose a valid appliance type")
        return stripped

    @field_validator("problem_description")
    @classmethod
    def problem_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("description cannot be empty")
        return stripped


class BookingAdminUpdate(BaseModel):
    """Admin-updatable booking fields."""

    status: Literal["new", "scheduled", "in_progress", "completed", "cancelled"] | None = None
    admin_notes: str | None = Field(default=None, max_length=4000)

    @field_validator("admin_notes")
    @classmethod
    def notes_trimmed(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()


class BookingResponse(BaseModel):
    """Response returned for admin and public booking flows."""

    id: int
    name: str
    phone: str
    email: str | None
    appliance_type: str
    problem_description: str
    status: str
    admin_notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
