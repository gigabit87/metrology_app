import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const API_URL = 'http://localhost:8000';

const Section = ({ title, children, bg = 'var(--bg-light)' }) => (
  <div style={{ padding: '1rem', background: bg, borderRadius: '12px', marginBottom: '1rem' }}>
    {title && <h4 style={{ marginBottom: '0.5rem' }}>{title}</h4>}
    {children}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>{label}</span><br />{value}</div>
);

function Calculator({ user, setUser }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('regression');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState(95);
  

  const [points, setPoints] = useState([{ id: 1, x: '', y: '' }]);
  const [regVarName, setRegVarName] = useState('X');
  const [regUnit, setRegUnit] = useState('мг/л');
  const [regYUnit, setRegYUnit] = useState('отн. ед.');
  const [regResults, setRegResults] = useState(null);
  const [chartPoints, setChartPoints] = useState([]);
  const [chartLine, setChartLine] = useState([]);

  const [sampleData, setSampleData] = useState([]);
  const [sampleInput, setSampleInput] = useState('');
  const [sampleResults, setSampleResults] = useState(null);
  const [sampleVarName, setSampleVarName] = useState('X');
  const [sampleUnit, setSampleUnit] = useState('мг/л');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) { setLoading(false); return; }
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
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
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
  };

  const addPoint = () => setPoints([...points, { id: Date.now(), x: '', y: '' }]);
  const removePoint = (id) => {
    if (points.length > 2) setPoints(points.filter(p => p.id !== id));
    else setError('Нужно минимум 2 точки');
  };
  const updatePoint = (id, field, value) => setPoints(points.map(p => p.id === id ? { ...p, [field]: value } : p));

  const handleRegression = async () => {
    const validPoints = points.filter(p => p.x !== '' && p.y !== '');
    if (validPoints.length < 2) {
      setError('Введите минимум 2 точки');
      return;
    }
    setCalculating(true);
    setError('');
    try {
      const reqData = { points: validPoints.map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) })), confidence };
      const response = await axios.post(`${API_URL}/api/calculations/regression`, reqData);
      const data = response.data;
      setRegResults(data);
      const xVals = validPoints.map(p => parseFloat(p.x));
      const yVals = validPoints.map(p => parseFloat(p.y));
      const newChartPoints = xVals.map((x, i) => ({ x, y: yVals[i] }));
      setChartPoints(newChartPoints);
      const minX = Math.min(...xVals);
      const maxX = Math.max(...xVals);
      const step = (maxX - minX) / 100;
      const line = [];
      for (let xi = minX; xi <= maxX; xi += step) line.push({ x: xi, y: data.a + data.b * xi });
      const newChartLine = line;
      setChartLine(newChartLine);
      
      await saveToHistory('regression', {
        points: validPoints.map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) })),
        confidence: confidence,
        variableName: regVarName,
        dimensionX: regUnit,
        dimensionY: regYUnit
      }, {
        ...data,
        chartPoints: newChartPoints,
        chartLine: newChartLine
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регрессии');
    } finally {
      setCalculating(false);
    }
  };

  const addSampleValue = () => { if (sampleInput !== '') setSampleData([...sampleData, parseFloat(sampleInput)]); setSampleInput(''); };
  const removeSampleValue = (idx) => setSampleData(sampleData.filter((_, i) => i !== idx));
  const clearSample = () => { setSampleData([]); setSampleResults(null); };

  const handleSample = async () => {
    if (sampleData.length < 2) { setError('Нужно минимум 2 значения'); return; }
    setCalculating(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/calculations/sample`, { data: sampleData, confidence });
      const data = response.data;
      setSampleResults(data);
      await saveToHistory('sample', {
        data: sampleData,
        confidence: confidence,
        variableName: sampleVarName,
        resultUnit: sampleUnit
      }, data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка статистики');
    } finally {
      setCalculating(false);
    }
  };

  const formatNumber = (value, decimals = 2) => value === undefined || value === null ? '' : parseFloat(value).toFixed(decimals);

  if (loading) return <div className="container" style={{ paddingTop: '80px' }}>Загрузка...</div>;

  return (
    <div style={{ paddingTop: '80px' }} className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="welcome-text">Здравствуйте, {user?.full_name || user?.username}</div>
          <div className="welcome-email">{user?.email}</div>
        </div>
        <div>Метрологическая обработка</div>
      </div>

      <div className="measurement-card">
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--primary-warm)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('regression')} 
            style={{
              background: activeTab === 'regression' ? 'var(--primary-warm)' : 'transparent',
              color: activeTab === 'regression' ? 'var(--text-dark)' : 'var(--primary-deep)',
              width: 'auto', padding: '0.5rem 1.5rem', marginTop: 0, borderRadius: '40px', cursor: 'pointer'
            }}>
            Регрессионный анализ
          </button>
          <button 
            onClick={() => setActiveTab('sample')} 
            style={{
              background: activeTab === 'sample' ? 'var(--primary-warm)' : 'transparent',
              color: activeTab === 'sample' ? 'var(--text-dark)' : 'var(--primary-deep)',
              width: 'auto', padding: '0.5rem 1.5rem', marginTop: 0, borderRadius: '40px', cursor: 'pointer'
            }}>
            Статистика выборки
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>Довер. вероятность</label>
            <select value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} style={{ marginLeft: '0.5rem', padding: '0.4rem' }}>
              <option value={90}>90%</option><option value={95}>95%</option><option value={99}>99%</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {activeTab === 'regression' ? (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Обозначение X (например, концентрация)</div>
                <input type="text" value={regVarName} onChange={(e) => setRegVarName(e.target.value)} placeholder="X" style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Единица измерения X</div>
                <input type="text" value={regUnit} onChange={(e) => setRegUnit(e.target.value)} placeholder="мг/л" style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Единица измерения Y (сигнал)</div>
                <input type="text" value={regYUnit} onChange={(e) => setRegYUnit(e.target.value)} placeholder="отн. ед." style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary-warm)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', width: '50px', textAlign: 'center' }}>№</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '35%', textAlign: 'center' }}>{regVarName} ({regUnit})</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '35%', textAlign: 'center' }}>Y ({regYUnit})</th>
                    <th style={{ padding: '0.75rem 0.5rem', width: '80px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point, idx) => (
                    <tr key={point.id}>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="number"
                          value={point.x}
                          onChange={(e) => updatePoint(point.id, 'x', e.target.value)}
                          style={{ width: '100%', marginBottom: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="number"
                          value={point.y}
                          onChange={(e) => updatePoint(point.id, 'y', e.target.value)}
                          style={{ width: '100%', marginBottom: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          onClick={() => removePoint(point.id)}
                          style={{
                            width: 'auto',
                            padding: '0.3rem 0.8rem',
                            marginTop: 0,
                            background: 'var(--error)',
                            color: 'white',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={addPoint} disabled={calculating} style={{ width: 'auto' }}>+ Добавить точку</button>
              <button onClick={handleRegression} disabled={calculating} style={{ width: 'auto', background: 'var(--primary-deep)' }}>Рассчитать регрессию</button>
            </div>

            {regResults && chartPoints.length > 0 && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '16px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart margin={{ top: 20, right: 30, left: 50, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" type="number" label={{ value: `${regVarName} (${regUnit})`, position: 'bottom' }} />
                    <YAxis dataKey="y" type="number" label={{ value: `Y (${regYUnit})`, angle: -90, position: 'left' }} />
                    <Tooltip />
                    <Line data={chartLine} type="monotone" dataKey="y" stroke="var(--primary-deep)" strokeWidth={2.5} dot={false} name="Линия регрессии" />
                    <Scatter data={chartPoints} fill="var(--primary-warm)" stroke="#fff" strokeWidth={1.5} name="Точки" r={6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {regResults && (
              <>
                <Section bg="var(--bg-light)" title="Параметры регрессии">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <DetailRow label="L (объём выборки)" value={regResults.n} />
                    <DetailRow label="R (относит. СКО)" value={`${regResults.s_percent}%`} />
                    <DetailRow label="P (довер. вероятность)" value={`${confidence}%`} />
                    <DetailRow label="a (свободный член)" value={regResults.a} />
                    <DetailRow label="b (коэф. наклона)" value={regResults.b} />
                    <DetailRow label="Sa (относ. ошибка a)" value={`${regResults.a_percent}%`} />
                    <DetailRow label="Sb (относ. ошибка b)" value={`${regResults.b_percent}%`} />
                    <DetailRow label={`${regVarName}min`} value={`${regResults.x_min} ${regUnit}`} />
                    <DetailRow label={`${regVarName}max`} value={`${regResults.x_max} ${regUnit}`} />
                  </div>
                </Section>

                <Section bg="var(--bg-light)" title="Качество модели">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    <DetailRow label="Уравнение" value={`Y = ${regResults.a} + ${regResults.b} × X`} />
                    <DetailRow label="R²" value={regResults.r2} />
                  </div>
                </Section>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Обозначение (что измеряем)</div>
                <input type="text" value={sampleVarName} onChange={(e) => setSampleVarName(e.target.value)} placeholder="X" style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Единица измерения</div>
                <input type="text" value={sampleUnit} onChange={(e) => setSampleUnit(e.target.value)} placeholder="мг/л" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '150px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.2rem' }}>Введите значение (нажмите Enter или кнопку Добавить)</div>
                <input type="number" value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSampleValue()} placeholder="Значение" style={{ width: '100%' }} />
              </div>
              <button onClick={addSampleValue} disabled={calculating} style={{ width: 'auto' }}>Добавить</button>
              <button onClick={clearSample} disabled={calculating} style={{ width: 'auto', background: 'var(--text-soft)' }}>Очистить всё</button>
            </div>

            {sampleData.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {sampleData.map((value, idx) => (
                  <div key={idx} style={{ background: 'var(--primary-warm)', padding: '0.3rem 0.7rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {formatNumber(value, 2)}
                    <button onClick={() => removeSampleValue(idx)} style={{ width: 'auto', padding: 0, marginTop: 0, background: 'transparent', fontSize: '0.8rem' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSample} disabled={calculating} style={{ marginBottom: '1rem' }}>Рассчитать</button>

            {sampleResults && (
              <Section bg="var(--bg-light)">
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontFamily: 'monospace'
                }}>
                  {sampleVarName} = {sampleResults.mean} ({sampleResults.cv}%) {sampleUnit}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <DetailRow label="Объём выборки (n)" value={sampleResults.n} />
                  <DetailRow label="Сумма" value={sampleResults.sum} />
                  <DetailRow label="Среднее" value={sampleResults.mean} />
                  <DetailRow label="Медиана" value={sampleResults.median} />
                  <DetailRow label="Дисперсия" value={sampleResults.variance} />
                  <DetailRow label="СКО (s)" value={sampleResults.std_dev} />
                  <DetailRow label="Коэффициент вариации CV" value={`${sampleResults.cv}%`} />
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Calculator;