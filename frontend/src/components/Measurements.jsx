import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Tooltip } from 'recharts';

const API_URL = 'http://localhost:8000';

function Measurements({ user, setUser }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedCalc, setSelectedCalc] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        await fetchHistory();
      } catch (err) {
        console.error('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };
    
    if (!user) {
      fetchUser();
    } else {
      fetchHistory();
      setLoading(false);
    }
  }, [user, setUser]);

  const fetchHistory = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`${API_URL}/api/history/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const deleteCalculation = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${API_URL}/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchHistory();
      if (selectedCalc?.id === id) setSelectedCalc(null);
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU');
  };

  const formatNumber = (num, decimals = 4) => {
    if (num === undefined || num === null) return '';
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return '0';
    return parsed.toFixed(decimals);
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '80px' }} className="container">
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '80px' }} className="dashboard">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="welcome-text">
            Здравствуйте, {user?.full_name || user?.username}
          </div>
          <div className="welcome-email">{user?.email}</div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
          История расчётов
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedCalc ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className="measurement-card" style={{ overflow: 'auto', maxHeight: '70vh' }}>
          <h3 style={{ marginBottom: '1rem' }}>Сохранённые расчёты</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)' }}>
              Нет сохранённых расчётов
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '0.8rem',
                  marginBottom: '0.8rem',
                  background: selectedCalc?.id === item.id ? 'var(--primary-warm)' : 'var(--bg-light)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedCalc(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                      {item.calculation_type === 'regression' ? 'Регрессионный анализ' : 'Статистика выборки'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCalculation(item.id);
                    }}
                    style={{
                      width: 'auto',
                      padding: '0.2rem 0.6rem',
                      background: 'var(--error)',
                      marginTop: 0,
                      fontSize: '0.7rem',
                      color: 'white'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedCalc && (
          <div className="measurement-card" style={{ overflow: 'auto', maxHeight: '70vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Детали расчёта</h3>
              <button
                onClick={() => setSelectedCalc(null)}
                style={{ width: 'auto', padding: '0.2rem 0.8rem', marginTop: 0, background: 'var(--text-soft)', color: 'white' }}
              >
                Закрыть
              </button>
            </div>
            
            <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: '0.5rem' }}>
              {formatDate(selectedCalc.created_at)}
            </div>

            {selectedCalc.calculation_type === 'regression' ? (
              <>
                {selectedCalc.results?.chartPoints && selectedCalc.results?.chartLine && (
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.5rem', 
                    background: 'var(--bg-card)', 
                    borderRadius: '12px',
                    border: '1px solid var(--primary-warm)'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-soft)', marginBottom: '0.3rem' }}>График регрессии</div>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="x" 
                          type="number" 
                          label={{ value: selectedCalc.input_data?.variableName || 'X', position: 'bottom' }} 
                          domain={['auto', 'auto']}
                        />
                        <YAxis 
                          dataKey="y" 
                          type="number" 
                          label={{ value: 'Y', angle: -90, position: 'left' }} 
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            if (name === 'y') return [`${value} ${selectedCalc.input_data?.dimensionY || 'отн. ед.'}`, 'Значение Y'];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `${selectedCalc.input_data?.variableName || 'X'} = ${label} ${selectedCalc.input_data?.dimensionX || 'мг/л'}`}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid var(--primary-warm)',
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                        />
                        <Line 
                          data={selectedCalc.results.chartLine} 
                          type="monotone" 
                          dataKey="y" 
                          stroke="var(--primary-deep)" 
                          strokeWidth={2.5} 
                          dot={false} 
                          name="Линия регрессии"
                        />
                        <Scatter 
                          data={selectedCalc.results.chartPoints} 
                          fill="var(--primary-warm)" 
                          stroke="#fff" 
                          strokeWidth={1.5} 
                          name="Точки"
                          r={5} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Граничные условия</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    L = {selectedCalc.results?.n || '—'}; R = {selectedCalc.results?.s_percent || '0'}%; P = {selectedCalc.input_data?.confidence || 95}%
                  </div>
                </div>

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Параметры регрессии</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    a = {formatNumber(selectedCalc.results?.a)}; b = {formatNumber(selectedCalc.results?.b)}; Sa = {selectedCalc.results?.a_percent || '0'}%; Sb = {selectedCalc.results?.b_percent || '0'}%
                  </div>
                </div>

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Рабочий диапазон</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    {selectedCalc.input_data?.variableName || 'X'}min = {formatNumber(selectedCalc.results?.x_min)} {selectedCalc.input_data?.dimensionX || 'мг/л'}; 
                    {selectedCalc.input_data?.variableName || 'X'}max = {formatNumber(selectedCalc.results?.x_max)} {selectedCalc.input_data?.dimensionX || 'мг/л'}
                  </div>
                </div>

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Качество модели</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                    Уравнение: {selectedCalc.results?.equation || 'Y = a + b×X'}; R² = {formatNumber(selectedCalc.results?.r2, 6)}
                  </div>
                </div>

                {selectedCalc.input_data?.points && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-soft)', marginBottom: '0.3rem' }}>Исходные точки</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                      {(() => {
                        const points = selectedCalc.input_data.points;
                        if (Array.isArray(points)) {
                          return points.map((p, i) => (
                            <span key={i} style={{ display: 'inline-block', marginRight: '0.8rem' }}>
                              ({formatNumber(p.x)}; {formatNumber(p.y)})
                            </span>
                          ));
                        } else if (typeof points === 'string') {
                          try {
                            const parsed = JSON.parse(points);
                            return parsed.map((p, i) => (
                              <span key={i} style={{ display: 'inline-block', marginRight: '0.8rem' }}>
                                ({formatNumber(p.x)}; {formatNumber(p.y)})
                              </span>
                            ));
                          } catch {
                            return points;
                          }
                        }
                        return JSON.stringify(points);
                      })()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                    {(() => {
                      const mean = parseFloat(selectedCalc.results?.mean);
                      const ciLower = parseFloat(selectedCalc.results?.ci_lower);
                      const ciUpper = parseFloat(selectedCalc.results?.ci_upper);
                      const cv = parseFloat(selectedCalc.results?.cv);
                      
                      if (isNaN(mean) || isNaN(ciLower) || isNaN(ciUpper) || isNaN(cv)) {
                        const varName = selectedCalc.input_data?.variableName || 'X';
                        const unit = selectedCalc.input_data?.resultUnit || 'мг/л';
                        return `${varName} = ${formatNumber(mean)} ${unit}`;
                      }
                      
                      const halfWidth = ((ciUpper - mean) / 2);
                      const errorPercent = isNaN(cv) ? 0 : cv;
                      const varName = selectedCalc.input_data?.variableName || 'X';
                      const unit = selectedCalc.input_data?.resultUnit || 'мг/л';
                      
                      return `${varName} = ${formatNumber(mean)}±${halfWidth.toFixed(2)} (${errorPercent.toFixed(1)}%) ${unit}`;
                    })()}
                  </div>
                </div>

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Статистические параметры</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    n = {selectedCalc.results?.n || '—'}; X̄ = {formatNumber(selectedCalc.results?.mean)}; s = {formatNumber(selectedCalc.results?.std_dev)}; CV = {formatNumber(selectedCalc.results?.cv)}%
                  </div>
                </div>

                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Доверительный интервал</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    P = {selectedCalc.input_data?.confidence || 95}%; ΔX = {formatNumber(selectedCalc.results?.ci_lower)} … {formatNumber(selectedCalc.results?.ci_upper)}
                  </div>
                </div>

                {selectedCalc.input_data?.data && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-soft)', marginBottom: '0.3rem' }}>Введённые данные</div>
                    <div style={{ padding: '0.6rem', background: 'var(--bg-light)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(() => {
                          const data = selectedCalc.input_data.data;
                          if (Array.isArray(data)) {
                            return data.map((val, i) => (
                              <span key={i} style={{ 
                                background: 'var(--primary-warm)', 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                                color: 'var(--text-dark)'
                              }}>
                                {formatNumber(val)}
                              </span>
                            ));
                          } else if (typeof data === 'string') {
                            try {
                              const parsed = JSON.parse(data);
                              return parsed.map((val, i) => (
                                <span key={i} style={{ 
                                  background: 'var(--primary-warm)', 
                                  padding: '0.2rem 0.6rem', 
                                  borderRadius: '16px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-dark)'
                                }}>
                                  {formatNumber(val)}
                                </span>
                              ));
                            } catch {
                              return data;
                            }
                          }
                          return JSON.stringify(data);
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Measurements;