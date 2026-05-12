from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from .. import models, schemas, auth
from ..database import get_db
import json

router = APIRouter(prefix="/api/history", tags=["history"])

@router.post("/save")
def save_calculation(
    calc_data: schemas.CalculationHistoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = models.CalculationHistory(
        user_id=current_user.id,
        calculation_type=calc_data.calculation_type,
        input_data=json.dumps(calc_data.input_data, ensure_ascii=False),
        results=json.dumps(calc_data.results, ensure_ascii=False)
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return {"message": "Сохранено", "id": history.id}

@router.get("/list")
def get_history(
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):

    history = db.query(models.CalculationHistory).filter(
        models.CalculationHistory.user_id == current_user.id
    ).order_by(desc(models.CalculationHistory.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for item in history:
        result.append({
            "id": item.id,
            "calculation_type": item.calculation_type,
            "input_data": json.loads(item.input_data),
            "results": json.loads(item.results),
            "created_at": item.created_at.isoformat()
        })
    return result

@router.get("/{calc_id}")
def get_calculation(
    calc_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    calc = db.query(models.CalculationHistory).filter(
        models.CalculationHistory.id == calc_id,
        models.CalculationHistory.user_id == current_user.id
    ).first()
    
    if not calc:
        raise HTTPException(status_code=404, detail="Расчёт не найден")
    
    return {
        "id": calc.id,
        "calculation_type": calc.calculation_type,
        "input_data": json.loads(calc.input_data),
        "results": json.loads(calc.results),
        "created_at": calc.created_at.isoformat()
    }

@router.delete("/{calc_id}")
def delete_calculation(
    calc_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    calc = db.query(models.CalculationHistory).filter(
        models.CalculationHistory.id == calc_id,
        models.CalculationHistory.user_id == current_user.id
    ).first()
    
    if not calc:
        raise HTTPException(status_code=404, detail="Расчёт не найден")
    
    db.delete(calc)
    db.commit()
    return {"message": "Удалено"}