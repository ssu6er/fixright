from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import BookingAdminUpdate, BookingRequest, BookingResponse
from orm_models import Booking

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a repair booking",
)
def create_booking(
    payload: BookingRequest,
    db: Session = Depends(get_db),
):
    record = Booking(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        appliance_type=payload.appliance_type,
        problem_description=payload.problem_description,
        status="new",
        admin_notes="",
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] create_booking: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save booking. Try again.",
        )


@router.get(
    "",
    response_model=List[BookingResponse],
    summary="Get all bookings (admin view)",
)
def list_bookings(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default=""),
    status_filter: str = Query(default="", alias="status"),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
):
    query = db.query(Booking)

    if search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            Booking.name.ilike(pattern)
            | Booking.phone.ilike(pattern)
            | Booking.problem_description.ilike(pattern)
            | Booking.appliance_type.ilike(pattern)
            | Booking.email.ilike(pattern)
        )

    if status_filter.strip():
        query = query.filter(Booking.status == status_filter.strip())

    return (
        query
        .order_by(Booking.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get a booking by ID",
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
):
    record = db.query(Booking).filter(Booking.id == booking_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking #{booking_id} not found",
        )
    return record


@router.patch(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Update booking status or admin notes",
)
def update_booking(
    booking_id: int,
    payload: BookingAdminUpdate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
):
    record = db.query(Booking).filter(Booking.id == booking_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking #{booking_id} not found",
        )

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided.",
        )

    if "status" in changes:
        record.status = changes["status"]
    if "admin_notes" in changes:
        record.admin_notes = changes["admin_notes"] or ""

    record.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(record)
        return record
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] update_booking: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking.",
        )
