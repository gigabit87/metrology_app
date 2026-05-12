import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '';
    return typeof num === 'number' ? num.toFixed(4) : num;
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
                    L = {selectedCalc.results?.n}; R = {selectedCalc.results?.sPercent || '0'}%; P = {selectedCalc.input_data?.confidence || 95}%
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
                    a = {selectedCalc.results?.a}; b = {selectedCalc.results?.b}; Sa = {selectedCalc.results?.aPercent || '0'}%; Sb = {selectedCalc.results?.bPercent || '0'}%
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
                    {selectedCalc.input_data?.variableName || 'X'}min = {selectedCalc.results?.xMin || '0'} {selectedCalc.input_data?.dimensionX || 'мг/л'}; {selectedCalc.input_data?.variableName || 'X'}max = {selectedCalc.results?.xMax || '0'} {selectedCalc.input_data?.dimensionX || 'мг/л'}
                  </div>
                </div>

                {/* Подробные результаты (опционально) */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--primary-deep)', fontSize: '0.85rem' }}>Подробные результаты</summary>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-light)', borderRadius: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Уравнение</span><br />{selectedCalc.results?.equation}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Коэф. корреляции R</span><br />{selectedCalc.results?.r}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Детерминация R²</span><br />{selectedCalc.results?.r2}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Остаточное СКО s</span><br />{selectedCalc.results?.s}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>a ± Δa</span><br />{selectedCalc.results?.a} ± {selectedCalc.results?.aCI}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>b ± Δb</span><br />{selectedCalc.results?.b} ± {selectedCalc.results?.bCI}</div>
                    </div>
                  </div>
                </details>

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
                {/* Основной результат выборки в стандартном формате */}
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
                      const ciLower = parseFloat(selectedCalc.results?.ciLower);
                      const ciUpper = parseFloat(selectedCalc.results?.ciUpper);
                      const halfWidth = ((ciUpper - mean) / 2).toFixed(2);
                      const errorPercent = ((halfWidth / mean) * 100).toFixed(1);
                      const varName = selectedCalc.input_data?.variableName || 'X';
                      const unit = selectedCalc.input_data?.resultUnit || 'мг/л';
                      return `${varName} = ${mean.toFixed(2)}±${halfWidth} (${errorPercent}%) ${unit}`;
                    })()}
                  </div>
                </div>

                {/* Статистические параметры */}
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Статистические параметры</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    n = {selectedCalc.results?.n}; X̄ = {selectedCalc.results?.mean}; s = {selectedCalc.results?.stdDev}; CV = {selectedCalc.results?.cv}%
                  </div>
                </div>

                {/* Доверительный интервал */}
                <div style={{
                  padding: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-warm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase' }}>Доверительный интервал</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    P = {selectedCalc.input_data?.confidence || 95}%; ΔX = {selectedCalc.results?.ciLower} … {selectedCalc.results?.ciUpper}
                  </div>
                </div>

                {/* Подробные результаты (опционально) */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--primary-deep)', fontSize: '0.85rem' }}>Подробные результаты</summary>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-light)', borderRadius: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Объём выборки (n)</span><br />{selectedCalc.results?.n}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Сумма (Σ)</span><br />{selectedCalc.results?.sum}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Среднее (x̄)</span><br />{selectedCalc.results?.mean}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Медиана</span><br />{selectedCalc.results?.median}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Дисперсия (s²)</span><br />{selectedCalc.results?.variance}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>СКО (s)</span><br />{selectedCalc.results?.stdDev}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Стандартная ошибка SEM</span><br />{selectedCalc.results?.sem}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Коэф. вариации CV (%)</span><br />{selectedCalc.results?.cv}%</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Минимум / Максимум</span><br />{selectedCalc.results?.min} / {selectedCalc.results?.max}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Размах</span><br />{selectedCalc.results?.range}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>Доверительный интервал</span><br />{selectedCalc.results?.ciLower} … {selectedCalc.results?.ciUpper}</div>
                      <div><span style={{ fontSize: '0.65rem', color: 'var(--text-soft)' }}>t-критерий</span><br />t({selectedCalc.results?.n - 1}) = {selectedCalc.results?.tValue}</div>
                    </div>
                  </div>
                </details>

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