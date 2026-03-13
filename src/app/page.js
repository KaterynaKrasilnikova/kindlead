"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Inter, Noto_Serif } from "next/font/google";
import { Sparkles, Mic, Copy, Check, Info, Lightbulb, RefreshCw, MessageSquareQuote, Users, Brain, Sun, BarChart2 } from "lucide-react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"] });

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [modelType, setModelType] = useState("SBI");
  const [tone, setTone] = useState("Нейтральний");
  
  const [feedbackData, setFeedbackData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kindlead_last_result');
        return saved ? JSON.parse(saved) : null;
      } catch { return null; }
    }
    return null;
  });
  const [rewritePrompt, setRewritePrompt] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateFeedback = async (e, isRewrite = false) => {
    e?.preventDefault();
    if (!rawText.trim()) return;
    
    setIsLoading(true);
    setError("");
    if (!isRewrite) {
      setFeedbackData(null);
      setRewritePrompt("");
    }
    setCopied(false);

    try {
      const payload = { rawText, modelType, tone };
      if (isRewrite && rewritePrompt.trim()) {
        payload.modifier = rewritePrompt;
      }

      const res = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate feedback");
      }

      setFeedbackData(data);
      try {
        localStorage.setItem('kindlead_last_result', JSON.stringify(data));
      } catch {}
      if (isRewrite) {
        setRewritePrompt("");
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
        setError('Перевищено ліміт запитів 🙅 зачекай, будь ласка, 1-2 хвилини і спробуй знову.');
      } else if (msg.includes('500') || msg.toLowerCase().includes('internal')) {
        setError('Щось пішло не так — спробуй ще раз. Якщо проблема повторується, перезавантаж сім.');
      } else {
        setError('Не вдалося yooсно — перевір, чи введено достатньо тексту.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      generateFeedback(e, false);
    }
  };

  const handleClear = () => {
    setRawText("");
    setFeedbackData(null);
    setError("");
    setRewritePrompt("");
    try { localStorage.removeItem('kindlead_last_result'); } catch {}
  };

  const copyToClipboard = () => {
    if (!feedbackData?.feedback_text) return;
    navigator.clipboard.writeText(feedbackData.feedback_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emotionColor = (score) => {
    if (score < 30) return '#859863'; // Olive green
    if (score < 70) return '#d4b856'; // Yellow/Gold
    return '#c25e5e'; // Reddish
  };

  return (
    <main className={`${styles.main} ${inter.className}`}>
      <div className={styles.container}>
        
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div className={styles.brandBadge}>
            <MessageSquareQuote size={18} className={styles.badgeIcon} />
            <span>KINDLEAD • BETA</span>
          </div>
          
          <h1 className={`${styles.title} ${notoSerif.className}`}>
            Структурований <br/>фідбек за хвилину
          </h1>
          <p className={styles.subtitle}>
            Твій помічник та перекладач з емоційної мови на конструктивну менеджерську. Опиши ситуацію своїми словами для отримання чіткого фідбеку.
          </p>

          <div className={styles.settingsBlock}>
            <div className={styles.frameworksGrid}>
              <button 
                type="button" 
                className={`${styles.frameCard} ${modelType === 'SBI' ? styles.frameActive : ''}`}
                onClick={() => setModelType('SBI')}
              >
                <h3 className={styles.frameTitle}>SBI</h3>
                <div className={styles.frameSteps}>Situation • Behavior • Impact</div>
                <p className={styles.frameDesc}>Для поточного фідбеку та корекції поведінки.</p>
                <div className={styles.frameExample}>
                  Що сталося? Хто був залучений?
                </div>
              </button>

              <button 
                type="button" 
                className={`${styles.frameCard} ${modelType === 'STAR' ? styles.frameActive : ''}`}
                onClick={() => setModelType('STAR')}
              >
                <h3 className={styles.frameTitle}>STAR</h3>
                <div className={styles.frameSteps}>Situation • Task • Action • Result</div>
                <p className={styles.frameDesc}>Для оцінки результатів та швидкого розвитку.</p>
                <div className={styles.frameExample}>
                  Яке було завдання? Які дії були вжиті? Який результат?
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          


          <form onSubmit={(e) => generateFeedback(e, false)} className={styles.formArea}>
            {feedbackData && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.newFeedbackBtn}
              >
                × Написати новий фідбек
              </button>
            )}
            <div className={styles.editorBox}>
              <div className={styles.editorHeaderPattern}></div>
              <textarea
                className={styles.textareaTop}
                placeholder="Опишіть ситуацію... Що сталося? Який результат?"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
              />
            </div>

            <div className={styles.toneRow}>
              <span className={styles.toneLabel}>ТОН</span>
              <div className={styles.toneList}>
                {['Нейтральний', 'Підтримуючий', 'Директивний'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.toneBtn} ${tone === t ? styles.toneActive : ''}`}
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.generateBtnOlive}
              disabled={isLoading || !rawText.trim()}
            >
              {isLoading && !feedbackData ? (
                <><span className={styles.spinner}></span> Перекладаю...</>
              ) : (
                <span>ЗГЕНЕРУВАТИ {modelType}-ФІДБЕК</span>
              )}
            </button>
            {error && <div className={styles.errorText}>{error}</div>}
          </form>

          {/* Skeleton while loading for the first time */}
          {isLoading && !feedbackData && (
            <div className={styles.skeletonWrapper}>
              <div className={styles.skeletonBar} style={{width: '60%', height: '8px', marginBottom: '1.5rem'}}></div>
              <div className={styles.skeletonBar} style={{height: '6px', marginBottom: '1rem'}}></div>
              <div className={styles.skeletonBar} style={{width: '85%', height: '6px', marginBottom: '1rem'}}></div>
              <div className={styles.skeletonBar} style={{width: '70%', height: '6px', marginBottom: '2rem'}}></div>
              <div className={styles.skeletonBar} style={{width: '40%', height: '6px', marginBottom: '0.5rem'}}></div>
              <div className={styles.skeletonBar} style={{height: '6px', marginBottom: '0.5rem'}}></div>
              <div className={styles.skeletonBar} style={{width: '75%', height: '6px'}}></div>
            </div>
          )}

          {/* Results Area */}
          {feedbackData && (
            <div className={`${styles.resultWrapper} ${styles.fadeIn}`}>
              
              <div className={styles.emotionMeterContainer}>
                <div className={styles.emotionHeader}>
                  <span className={styles.emotionTitle}>Емоційна напруга у твоєму тексті</span>
                  <span className={styles.emotionLabel} style={{ color: emotionColor(feedbackData.emotion_score) }}>
                    {feedbackData.emotion_label}
                  </span>
                </div>
                <div className={styles.emotionTrack}>
                  <div 
                    className={styles.emotionFill} 
                    style={{ 
                      width: `${feedbackData.emotion_score}%`,
                      backgroundColor: emotionColor(feedbackData.emotion_score) 
                    }}
                  ></div>
                </div>
                <div className={styles.emotionScale}>
                  <span>😌 Спокійно</span>
                  <span>😤 Дуже емоційно</span>
                </div>
              </div>

              {feedbackData.changes_explained && (
                <div className={styles.analysisBox}>
                  <Info size={18} className={styles.analysisIcon} />
                  <div className={styles.analysisText}>
                    <strong>Що змінено:</strong>
                    <ul className={styles.changesList}>
                      {(Array.isArray(feedbackData.changes_explained)
                        ? feedbackData.changes_explained
                        : feedbackData.changes_explained
                            .split('•')
                            .map(s => s.trim())
                            .filter(Boolean)
                      ).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className={styles.resultHeader}>
                <h3>Структурований результат</h3>
                <div className={styles.headerActions}>
                  <button onClick={copyToClipboard} className={styles.copyBtn}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Скопійовано' : 'Скопіювати'}</span>
                  </button>
                </div>
              </div>
              
              <div className={styles.resultContent}>
                {isLoading ? (
                  <div className={styles.reloadingOverlay}>
                    <span className={styles.spinnerDark}></span> Оновлюємо...
                  </div>
                ) : (
                  feedbackData.feedback_text.split('\n').map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                  ))
                )}
              </div>

              {feedbackData.tips && feedbackData.tips.length > 0 && (
                <div className={styles.tipsContainer}>
                  <div className={styles.tipsHeader}>
                    <Lightbulb size={18} className={styles.tipsIcon} />
                    <h4>Комунікаційні поради</h4>
                  </div>
                  <ul className={styles.tipsList}>
                    {feedbackData.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.regenerateSection}>
                <input 
                  type="text" 
                  className={styles.regenerateInput}
                  placeholder="Що змінити? (напр: 'м'якше')"
                  value={rewritePrompt}
                  onChange={(e) => setRewritePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      generateFeedback(e, true);
                    }
                  }}
                />
                <button 
                  className={styles.regenerateBtn} 
                  onClick={(e) => generateFeedback(e, true)}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? styles.spinningIcon : ''} />
                  <span>Переписати</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
