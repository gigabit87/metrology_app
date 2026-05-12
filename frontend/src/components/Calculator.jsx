import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Calculator({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('regression');
  const [loading, setLoading] = useState(true);
  
  const [points, setPoints] = useState([{ id: 1, x: '', y: '' }]);
  const [confidence, setConfidence] = useState(95);
  const [dimensionX, setDimensionX] = useState('мг/л');
  const [dimensionY, setDimensionY] = useState('отн. ед.');
  const [numberFormat, setNumberFormat] = useState('0,00');
  const [results, setResults] = useState(null);
  const [predictX, setPredictX] = useState('');
  const [predictY, setPredictY] = useState('');
  const [predictResult, setPredictResult] = useState(null);
  
  // Настройки вывода для регрессии
  const [regVariableName, setRegVariableName] = useState('X');
  const [regResultUnit, setRegResultUnit] = useState('мг/л');
  
  const [sampleData, setSampleData] = useState([]);
  const [sampleInput, setSampleInput] = useState('');
  const [sampleResults, setSampleResults] = useState(null);
  // Настройки вывода для выборки
  const [sampleVariableName, setSampleVariableName] = useState('X');
  const [sampleResultUnit, setSampleResultUnit] = useState('мг/л');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };
    if (!user) fetchUser();
    else setLoading(false);
  }, [user, setUser]);

  const saveToHistory = async (type, inputData, resultsData) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      await axios.post(`${API_URL}/api/history/save`, {
        calculation_type: type,
        input_data: inputData,
        results: resultsData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Сохранено в историю');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  };

  const getTValue = (p, df) => {
    if (df < 1) return 0;
    const tTable = {
      90: { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 15: 1.753, 20: 1.725, 30: 1.697, 60: 1.671, 120: 1.658 },
      95: { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 15: 2.131, 20: 2.086, 30: 2.042, 60: 2.000, 120: 1.980 },
      99: { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169, 15: 2.947, 20: 2.845, 30: 2.750, 60: 2.660, 120: 2.617 }
    };
    const dfKey = df <= 10 ? df : df <= 15 ? 15 : df <= 20 ? 20 : df <= 30 ? 30 : df <= 60 ? 60 : 120;
    return tTable[p]?.[dfKey] || tTable[p]?.[120] || 2.0;
  };

  const addPoint = () => {
    const newId = Date.now();
    setPoints([...points, { id: newId, x: '', y: '' }]);
  };

  const removePoint = (id) => {
    if (points.length > 2) {
      setPoints(points.filter(p => p.id !== id));
    } else {
      alert('Для регрессионного анализа нужно минимум 2 точки');
    }
  };

  const updatePoint = (id, field, value) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const calculateRegression = () => {
    const valid = points.filter(p => p.x !== '' && p.y !== '');
    if (valid.length < 2) {
      alert('Для регрессионного анализа нужно минимум 2 точки');
      return;
    }
    
    const n = valid.length;
    const x = valid.map(p => parseFloat(p.x));
    const y = valid.map(p => parseFloat(p.y));
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
    const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
    const sumY2 = y.reduce((s, yi) => s + yi * yi, 0);
    
    const denom = n * sumX2 - sumX * sumX;
    const b = (n * sumXY - sumX * sumY) / denom;
    const a = (sumY - b * sumX) / n;
    
    const yPred = x.map(xi => a + b * xi);
    const residuals = y.map((yi, i) => yi - yPred[i]);
    const RSS = residuals.reduce((s, r) => s + r * r, 0);
    const yMean = sumY / n;
    const TSS = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
    const R2 = 1 - RSS / TSS;
    
    const s = Math.sqrt(RSS / (n - 2));
    const sxx = sumX2 - sumX * sumX / n;
    const sb = s / Math.sqrt(sxx);
    const sa = s * Math.sqrt(1 / n + (sumX * sumX) / (n * sxx));
    const tVal = getTValue(confidence, n - 2);
    const aCI = tVal * sa;
    const bCI = tVal * sb;
    const xMean = sumX / n;
    
    const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const predictYFunc = (x0) => a + b * x0;
    const predictYCI = (x0) => {
      const sy = s * Math.sqrt(1 + 1 / n + (x0 - xMean) ** 2 / sxx);
      const lower = predictYFunc(x0) - tVal * sy;
      const upper = predictYFunc(x0) + tVal * sy;
      return { lower, upper };
    };
    
    const predictXFunc = (y0) => (y0 - a) / b;
    const predictXCI = (y0) => {
      const syx = s / Math.abs(b);
      const x0 = predictXFunc(y0);
      const lower = x0 - tVal * syx;
      const upper = x0 + tVal * syx;
      return { lower, upper };
    };
    
    // Дополнительные расчёты для вывода
    const xValuesNum = x.map(v => parseFloat(v));
    const xMin = Math.min(...xValuesNum).toFixed(2);
    const xMax = Math.max(...xValuesNum).toFixed(2);
    const sPercent = ((s / Math.abs(yMean)) * 100).toFixed(2);
    const aPercent = ((aCI / Math.abs(a)) * 100).toFixed(2);
    const bPercent = ((bCI / Math.abs(b)) * 100).toFixed(2);
    
    const resultsData = {
      n, a: a.toFixed(4), b: b.toFixed(4), aCI: aCI.toFixed(4), bCI: bCI.toFixed(4),
      aLower: (a - aCI).toFixed(4), aUpper: (a + aCI).toFixed(4),
      bLower: (b - bCI).toFixed(4), bUpper: (b + bCI).toFixed(4),
      r: r.toFixed(4), r2: R2.toFixed(4), s: s.toFixed(4),
      equation: `Y = ${a.toFixed(4)} + ${b.toFixed(4)} × ${regVariableName}`,
      xMean: xMean.toFixed(2), yMean: yMean.toFixed(2),
      sPercent: sPercent, aPercent: aPercent, bPercent: bPercent,
      xMin: xMin, xMax: xMax
    };
    
    setResults({
      ...resultsData,
      predictYFunc, predictYCI, predictXFunc, predictXCI, tVal, s, n, xMean, sxx
    });
    
    setPredictResult(null);
    setPredictX('');
    setPredictY('');
    
    saveToHistory('regression', {
      points: valid.map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) })),
      confidence: confidence,
      dimensionX: dimensionX,
      dimensionY: dimensionY,
      variableName: regVariableName
    }, resultsData);
  };

  const handlePredictY = () => {
    if (!results || !predictX) return;
    const x0 = parseFloat(predictX);
    if (isNaN(x0)) return;
    const y0 = results.predictYFunc(x0);
    const ci = results.predictYCI(x0);
    setPredictResult({
      type: `${regVariableName} → Y`,
      input: `${x0} ${regResultUnit}`,
      value: `${y0.toFixed(4)} ${dimensionY}`,
      ci: `${ci.lower.toFixed(4)} … ${ci.upper.toFixed(4)} ${dimensionY}`
    });
  };

  const handlePredictX = () => {
    if (!results || !predictY) return;
    const y0 = parseFloat(predictY);
    if (isNaN(y0)) return;
    const x0 = results.predictXFunc(y0);
    const ci = results.predictXCI(y0);
    setPredictResult({
      type: `Y → ${regVariableName}`,
      input: `${y0} ${dimensionY}`,
      value: `${x0.toFixed(4)} ${regResultUnit}`,
      ci: `${ci.lower.toFixed(4)} … ${ci.upper.toFixed(4)} ${regResultUnit}`
    });
  };

  const addSample = () => {
    if (sampleInput === '') return;
    const num = parseFloat(sampleInput);
    if (isNaN(num)) return;
    setSampleData([...sampleData, num]);
    setSampleInput('');
  };

  const removeSample = (idx) => {
    setSampleData(sampleData.filter((_, i) => i !== idx));
  };

  const clearSample = () => {
    setSampleData([]);
    setSampleResults(null);
  };

  const calculateSampleStats = () => {
    if (sampleData.length < 2) {
      alert('Для статистической обработки нужно минимум 2 значения');
      return;
    }
    
    const n = sampleData.length;
    const sum = sampleData.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = sampleData.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const sem = stdDev / Math.sqrt(n);
    const tVal = getTValue(confidence, n - 1);
    const margin = tVal * sem;
    const cv = (stdDev / Math.abs(mean)) * 100;
    
    const sorted = [...sampleData].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
    const min = Math.min(...sampleData);
    const max = Math.max(...sampleData);
    const range = max - min;
    
    const resultsData = {
      n, sum: sum.toFixed(4), mean: mean.toFixed(4), median: median.toFixed(4),
      variance: variance.toFixed(6), stdDev: stdDev.toFixed(4), sem: sem.toFixed(4),
      cv: cv.toFixed(2), min: min.toFixed(4), max: max.toFixed(4), range: range.toFixed(4),
      ciLower: (mean - margin).toFixed(4), ciUpper: (mean + margin).toFixed(4),
      tValue: tVal.toFixed(4)
    };
    
    setSampleResults(resultsData);
    
    saveToHistory('sample', {
      data: sampleData,
      confidence: confidence,
      variableName: sampleVariableName,
      resultUnit: sampleResultUnit
    }, resultsData);
  };

  const formatNum = (v) => {
    if (v === '' || v === undefined) return '';
    const num = parseFloat(v);
    if (isNaN(num)) return v;
    const d = numberFormat === '0,00' ? 2 : numberFormat === '0,000' ? 3 : 4;
    return num.toFixed(d);
  };

  if (loading) {
    return <div style={{ paddingTop: '80px' }} className="container">Загрузка...</div>;
  }

  return (
    <div style={{ paddingTop: '80px' }} className="dashboard">
      <div className="dashboard-header" style={{ marginBottom: '1rem' }}>
        <div>
          <div className="welcome-text">Здравствуйте, {user?.full_name || user?.username}</div>
          <div className="welcome-email">{user?.email}</div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Метрологическая обработка</div>
      </div>

      <div className="measurement-card">
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--primary-warm)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('regression')} 
            style={{ 
              background: activeTab === 'regression' ? 'var(--primary-warm)' : 'transparent',
              color: activeTab === 'regression' ? 'var(--text-dark)' : 'var(--primary-deep)',
              width: 'auto', padding: '0.4rem 1.2rem', marginTop: 0, borderRadius: '40px',
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
            }}
          >
            Регрессионный анализ
          </button>
          <button 
            onClick={() => setActiveTab('sample')} 
            style={{ 
              background: activeTab === 'sample' ? 'var(--primary-warm)' : 'transparent',
              color: activeTab === 'sample' ? 'var(--text-dark)' : 'var(--primary-deep)',
              width: 'auto', padding: '0.4rem 1.2rem', marginTop: 0, borderRadius: '40px',
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
            }}
          >
            Статистика выборки
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Довер. вероятность</label>
            <select value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} style={{ padding: '0.4rem 0.8rem', marginLeft: '0.5rem' }}>
              <option value={90}>90%</option><option value={95}>95%</option><option value={99}>99%</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Формат чисел</label>
            <select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} style={{ padding: '0.4rem 0.8rem', marginLeft: '0.5rem' }}>
              <option value="0,00">2 знака</option><option value="0,000">3 знака</option><option value="0,0000">4 знака</option>
            </select>
          </div>
        </div>

        {/* РЕГРЕССИОННЫЙ АНАЛИЗ */}
        {activeTab === 'regression' && (
          <>
            {/* Настройки вывода для регрессии */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--primary-warm)'
            }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', display: 'block', marginBottom: '0.25rem' }}>
                  Обозначение переменной (вместо X)
                </label>
                <input
                  type="text"
                  value={regVariableName}
                  onChange={(e) => setRegVariableName(e.target.value)}
                  placeholder="Например: X, C, m"
                  style={{ padding: '0.6rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', display: 'block', marginBottom: '0.25rem' }}>
                  Единицы измерения результата
                </label>
                <input
                  type="text"
                  value={regResultUnit}
                  onChange={(e) => setRegResultUnit(e.target.value)}
                  placeholder="Например: мг/л, г/л, %"
                  style={{ padding: '0.6rem' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary-warm)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-dark)' }}>№</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-dark)' }}>{regVariableName} ({regResultUnit})</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-dark)' }}>Y ({dimensionY})</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-dark)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={p.x} onChange={(e) => updatePoint(p.id, 'x', e.target.value)} style={{ width: '100px', marginBottom: 0 }} /></td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={p.y} onChange={(e) => updatePoint(p.id, 'y', e.target.value)} style={{ width: '100px', marginBottom: 0 }} /></td>
                      <td style={{ padding: '0.5rem' }}><button onClick={() => removePoint(p.id)} style={{ width: 'auto', padding: '0.2rem 0.6rem', marginTop: 0, background: 'var(--error)', color: 'white' }}>Удалить</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={addPoint} style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: 0 }}>+ Добавить точку</button>
              <button onClick={calculateRegression} style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: 0, background: 'var(--primary-deep)' }}>Рассчитать регрессию</button>
            </div>

            {results && (
              <div style={{ marginTop: '1.5rem' }}>
                {/* Граничные условия */}
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Граничные условия</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    L = {results.n}; R = {results.sPercent}%; P = {confidence}%
                  </div>
                </div>

                {/* Параметры регрессии */}
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Параметры регрессии</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    a = {results.a}; b = {results.b}; Sa = {results.aPercent}%; Sb = {results.bPercent}%
                  </div>
                </div>

                {/* Рабочий диапазон */}
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Рабочий диапазон</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    {regVariableName}min = {results.xMin} {regResultUnit}; {regVariableName}max = {results.xMax} {regResultUnit}
                  </div>
                </div>

                {/* Подробные результаты */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--primary-deep)', fontSize: '0.85rem' }}>Подробные результаты</summary>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-light)', borderRadius: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Уравнение</span><br />{results.equation}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Коэф. корреляции R</span><br />{results.r}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Детерминация R²</span><br />{results.r2}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Остаточное СКО s</span><br />{results.s}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>a ± Δa</span><br />{results.a} ± {results.aCI}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>b ± Δb</span><br />{results.b} ± {results.bCI}</div>
                    </div>
                  </div>
                </details>

                {/* Прогнозирование */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--primary-warm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Прогнозирование</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.3rem' }}>Найти Y по {regVariableName}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="number" value={predictX} onChange={(e) => setPredictX(e.target.value)} placeholder={`${regVariableName} (${regResultUnit})`} style={{ width: '120px', marginBottom: 0 }} />
                        <button onClick={handlePredictY} style={{ width: 'auto', padding: '0.3rem 0.8rem', marginTop: 0 }}>Рассчитать</button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.3rem' }}>Найти {regVariableName} по Y</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="number" value={predictY} onChange={(e) => setPredictY(e.target.value)} placeholder={`Y (${dimensionY})`} style={{ width: '120px', marginBottom: 0 }} />
                        <button onClick={handlePredictX} style={{ width: 'auto', padding: '0.3rem 0.8rem', marginTop: 0 }}>Рассчитать</button>
                      </div>
                    </div>
                  </div>
                  
                  {predictResult && (
                    <div style={{ marginTop: '0.8rem', padding: '0.6rem', background: 'var(--bg-light)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Результат: {predictResult.type}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                        {predictResult.input} → {predictResult.value}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>
                        Доверительный интервал ({confidence}%): {predictResult.ci}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* СТАТИСТИКА ВЫБОРКИ */}
        {activeTab === 'sample' && (
          <>
            {/* Настройки вывода для выборки */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--primary-warm)'
            }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', display: 'block', marginBottom: '0.25rem' }}>
                  Обозначение результата
                </label>
                <input
                  type="text"
                  value={sampleVariableName}
                  onChange={(e) => setSampleVariableName(e.target.value)}
                  placeholder="Например: X, C, m"
                  style={{ padding: '0.6rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', display: 'block', marginBottom: '0.25rem' }}>
                  Единицы измерения
                </label>
                <input
                  type="text"
                  value={sampleResultUnit}
                  onChange={(e) => setSampleResultUnit(e.target.value)}
                  placeholder="Например: мг/л, г/л, %"
                  style={{ padding: '0.6rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="number" value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSample()} placeholder="Значение" style={{ flex: 1, minWidth: '150px' }} />
              <button onClick={addSample} style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: 0 }}>Добавить</button>
              <button onClick={clearSample} style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: 0, background: 'var(--text-soft)' }}>Очистить всё</button>
            </div>

            {sampleData.length > 0 && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {sampleData.map((v, i) => (
                    <div key={i} style={{ background: 'var(--primary-warm)', padding: '0.3rem 0.7rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dark)' }}>
                      {formatNum(v)}
                      <button onClick={() => removeSample(i)} style={{ width: 'auto', padding: 0, marginTop: 0, background: 'transparent', fontSize: '0.8rem', color: 'var(--text-dark)' }}>×</button>
                    </div>
                  ))}
                </div>
                <button onClick={calculateSampleStats} style={{ width: 'auto', padding: '0.4rem 1rem', marginBottom: '1rem' }}>Рассчитать статистику</button>
              </>
            )}

            {sampleResults && (
              <>
                {/* Вывод результата в формате X = 5,25±3,53 (67,3%) мг/л */}
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '2px solid var(--primary-deep)',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                    {(() => {
                      const mean = parseFloat(sampleResults.mean);
                      const ciLower = parseFloat(sampleResults.ciLower);
                      const ciUpper = parseFloat(sampleResults.ciUpper);
                      const halfWidth = ((ciUpper - mean) / 2).toFixed(2);
                      const errorPercent = ((halfWidth / mean) * 100).toFixed(1);
                      return `${sampleVariableName} = ${mean.toFixed(2)}±${halfWidth} (${errorPercent}%) ${sampleResultUnit}`;
                    })()}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '0.8rem' }}>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Объём выборки</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.n}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Сумма</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.sum}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Среднее арифметическое</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.mean}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Медиана</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.median}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Дисперсия</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.variance}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>СКО (s)</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.stdDev}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Стандартная ошибка SEM</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.sem}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Коэф. вариации CV (%)</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.cv}%</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Минимум / Максимум</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.min} / {sampleResults.max}</strong></div>
                    <div><span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Размах</span><br /><strong style={{ color: 'var(--text-dark)' }}>{sampleResults.range}</strong></div>
                  </div>
                  <div style={{ padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '10px', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Доверительный интервал для среднего (P={confidence}%)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-dark)' }}>{sampleResults.ciLower} … {sampleResults.ciUpper}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginTop: '0.2rem' }}>t({sampleResults.n - 1}) = {sampleResults.tValue}</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Calculator;