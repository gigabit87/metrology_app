import math
from typing import List, Dict, Any

def get_t_value(p: float, df: int) -> float:

    if df < 1:
        return 0
    t_table = {
        90: {1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 15: 1.753, 20: 1.725, 30: 1.697, 60: 1.671, 120: 1.658},
        95: {1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 15: 2.131, 20: 2.086, 30: 2.042, 60: 2.000, 120: 1.980},
        99: {1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169, 15: 2.947, 20: 2.845, 30: 2.750, 60: 2.660, 120: 2.617}
    }
    df_key = df if df <= 10 else 15 if df <= 15 else 20 if df <= 20 else 30 if df <= 30 else 60 if df <= 60 else 120
    return t_table.get(p, {}).get(df_key, 2.0)


def calculate_regression(points: List[Dict[str, float]], confidence: float = 95):

    if len(points) < 2:
        raise ValueError("Для регрессионного анализа нужно минимум 2 точки")
    
    n = len(points)
    x = [p["x"] for p in points]
    y = [p["y"] for p in points]
    
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x2 = sum(xi * xi for xi in x)
    sum_y2 = sum(yi * yi for yi in y)
    
    denom = n * sum_x2 - sum_x * sum_x
    if denom == 0:
        raise ValueError("Невозможно рассчитать регрессию: все значения X одинаковы")
    
    b = (n * sum_xy - sum_x * sum_y) / denom
    a = (sum_y - b * sum_x) / n

    y_pred = [a + b * xi for xi in x]
    residuals = [y[i] - y_pred[i] for i in range(n)]
    
 
    rss = sum(r * r for r in residuals)
    

    y_mean = sum_y / n
    tss = sum((yi - y_mean) ** 2 for yi in y)
    

    r2 = 1 - rss / tss if tss != 0 else 0
    r = math.sqrt(abs(r2))
    
    s = math.sqrt(rss / (n - 2)) if n > 2 else 0
    
    sxx = sum_x2 - sum_x * sum_x / n
    if sxx == 0:
        raise ValueError("Невозможно рассчитать стандартные ошибки")
    
    sb = s / math.sqrt(sxx)
    sa = s * math.sqrt(1 / n + (sum_x * sum_x) / (n * sxx))
    

    t_val = get_t_value(confidence, n - 2)
    

    a_ci = t_val * sa
    b_ci = t_val * sb
    

    numerator = n * sum_xy - sum_x * sum_y
    denominator = math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y))
    pearson_r = numerator / denominator if denominator != 0 else 0
    

    x_min = min(x)
    x_max = max(x)
    x_mean = sum_x / n
    s_percent = (s / abs(y_mean)) * 100 if y_mean != 0 else 0
    a_percent = (a_ci / abs(a)) * 100 if a != 0 else 0
    b_percent = (b_ci / abs(b)) * 100 if b != 0 else 0
    
    return {
        "n": n,
        "a": round(a, 6),
        "b": round(b, 6),
        "a_ci": round(a_ci, 6),
        "b_ci": round(b_ci, 6),
        "a_lower": round(a - a_ci, 6),
        "a_upper": round(a + a_ci, 6),
        "b_lower": round(b - b_ci, 6),
        "b_upper": round(b + b_ci, 6),
        "r": round(pearson_r, 6),
        "r2": round(r2, 6),
        "s": round(s, 6),
        "x_mean": round(x_mean, 4),
        "y_mean": round(y_mean, 4),
        "s_percent": round(s_percent, 2),
        "a_percent": round(a_percent, 2),
        "b_percent": round(b_percent, 2),
        "x_min": round(x_min, 4),
        "x_max": round(x_max, 4),
        "equation": f"Y = {round(a, 4)} + {round(b, 4)} × X"
    }


def predict_y_by_x(a: float, b: float, x0: float, n: int, x_mean: float, sxx: float, s: float, t_val: float):

    y0 = a + b * x0
    sy = s * math.sqrt(1 + 1/n + (x0 - x_mean) ** 2 / sxx)
    ci_lower = y0 - t_val * sy
    ci_upper = y0 + t_val * sy
    return {
        "result": round(y0, 6),
        "ci_lower": round(ci_lower, 6),
        "ci_upper": round(ci_upper, 6)
    }


def predict_x_by_y(a: float, b: float, y0: float, n: int, x_mean: float, sxx: float, s: float, t_val: float):

    x0 = (y0 - a) / b
    syx = s / abs(b)
    ci_lower = x0 - t_val * syx
    ci_upper = x0 + t_val * syx
    return {
        "result": round(x0, 6),
        "ci_lower": round(ci_lower, 6),
        "ci_upper": round(ci_upper, 6)
    }