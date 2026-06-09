from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from ..database import get_db
from .. import models, auth
from ..services.regression import calculate_regression, predict_y_by_x, predict_x_by_y
from ..services.sample import calculate_sample_statistics, calculate_grubbs

router = APIRouter(prefix="/api/calculations", tags=["calculations"])

class RegressionRequest(BaseModel):
    points: List[Dict[str, float]]
    confidence: float = 95
    variable_name: str = "X"
    dimension_x: str = "мг/л"
    dimension_y: str = "отн. ед."

class SampleRequest(BaseModel):
    data: List[float]
    confidence: float = 95
    variable_name: str = "X"
    result_unit: str = "мг/л"

class PredictRequest(BaseModel):
    a: float
    b: float
    n: int
    x_mean: float
    sxx: float
    s: float
    t_val: float
    x0: float = None
    y0: float = None

class GrubbsRequest(BaseModel):
    data: List[float]
    confidence: float = 95


@router.post("/regression")
def regression(request: RegressionRequest):

    try:
        result = calculate_regression(request.points, request.confidence)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regression/predict_y")
def predict_y(request: PredictRequest):

    if request.x0 is None:
        raise HTTPException(status_code=400, detail="Не указано значение X")
    try:
        result = predict_y_by_x(
            request.a, request.b, request.x0,
            request.n, request.x_mean, request.sxx, request.s, request.t_val
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regression/predict_x")
def predict_x(request: PredictRequest):

    if request.y0 is None:
        raise HTTPException(status_code=400, detail="Не указано значение Y")
    try:
        result = predict_x_by_y(
            request.a, request.b, request.y0,
            request.n, request.x_mean, request.sxx, request.s, request.t_val
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sample")
def sample(request: SampleRequest):

    if len(request.data) < 2:
        raise HTTPException(status_code=400, detail="Для статистической обработки нужно минимум 2 значения")
    try:
        result = calculate_sample_statistics(request.data, request.confidence)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sample/grubbs")
def grubbs(request: GrubbsRequest):

    if len(request.data) < 3:
        raise HTTPException(status_code=400, detail="Для проверки на выбросы нужно минимум 3 значения")
    try:
        result = calculate_grubbs(request.data, request.confidence)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))