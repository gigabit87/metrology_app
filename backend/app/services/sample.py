import math
from typing import List


def get_t_value(p: float, df: int) -> float:
    """распределения Стьюдента"""
    if df < 1:
        return 0
    t_table = {
        90: {1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 15: 1.753, 20: 1.725, 30: 1.697, 60: 1.671, 120: 1.658},
        95: {1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 15: 2.131, 20: 2.086, 30: 2.042, 60: 2.000, 120: 1.980},
        99: {1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169, 15: 2.947, 20: 2.845, 30: 2.750, 60: 2.660, 120: 2.617}
    }
    df_key = df if df <= 10 else 15 if df <= 15 else 20 if df <= 20 else 30 if df <= 30 else 60 if df <= 60 else 120
    return t_table.get(p, {}).get(df_key, 2.0)


def calculate_sample_statistics(data: List[float], confidence: float = 95):

    if len(data) < 2:
        raise ValueError("Для статистической обработки нужно минимум 2 значения")
    
    n = len(data)
    data_sorted = sorted(data)
    
    sum_val = sum(data)
    mean = sum_val / n

    variance = sum((v - mean) ** 2 for v in data) / (n - 1)
    std_dev = math.sqrt(variance)

    sem = std_dev / math.sqrt(n)

    if n % 2 == 0:
        median = (data_sorted[n // 2 - 1] + data_sorted[n // 2]) / 2
    else:
        median = data_sorted[n // 2]

    min_val = min(data)
    max_val = max(data)
    range_val = max_val - min_val

    cv = (std_dev / abs(mean)) * 100 if mean != 0 else 0

    t_val = get_t_value(confidence, n - 1)
    margin = t_val * sem
    ci_lower = mean - margin
    ci_upper = mean + margin
    
    return {
        "n": n,
        "sum": round(sum_val, 4),
        "mean": round(mean, 4),
        "median": round(median, 4),
        "variance": round(variance, 6),
        "std_dev": round(std_dev, 4),
        "sem": round(sem, 4),
        "cv": round(cv, 2),
        "min": round(min_val, 4),
        "max": round(max_val, 4),
        "range": round(range_val, 4),
        "ci_lower": round(ci_lower, 4),
        "ci_upper": round(ci_upper, 4),
        "t_value": round(t_val, 4)
    }


def calculate_grubbs(data: List[float], confidence: float = 95):

    n = len(data)
    if n < 3:
        return {"has_outlier": False, "message": "Для проверки на выбросы нужно минимум 3 значения"}
    
    mean = sum(data) / n
    std_dev = math.sqrt(sum((v - mean) ** 2 for v in data) / (n - 1))

    grubbs_table = {
        3: 1.155, 4: 1.481, 5: 1.715, 6: 1.887, 7: 2.020, 8: 2.126, 9: 2.215, 10: 2.290,
        11: 2.355, 12: 2.412, 13: 2.462, 14: 2.507, 15: 2.549, 16: 2.585, 17: 2.620, 18: 2.651,
        19: 2.681, 20: 2.709, 25: 2.822, 30: 2.908, 40: 3.036, 50: 3.128, 100: 3.377
    }
    
    n_key = min(n, 100)
    keys = list(grubbs_table.keys())
    closest = min(keys, key=lambda k: abs(k - n_key))
    grubbs_critical = grubbs_table[closest]
    
    deviations = [abs(v - mean) for v in data]
    max_deviation = max(deviations)
    grubbs_stat = max_deviation / std_dev if std_dev != 0 else 0
    
    return {
        "grubbs_stat": round(grubbs_stat, 4),
        "grubbs_critical": round(grubbs_critical, 4),
        "has_outlier": grubbs_stat > grubbs_critical
    }