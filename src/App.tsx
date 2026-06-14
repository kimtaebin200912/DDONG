import React, { useState, useEffect } from 'react';

// ⚠️ 여기에 내 진짜 수파베이스 주소와 anon_key를 따옴표 안에 직접 넣어주세요!
const SUPABASE_URL = "내_수파베이스_주소";
const SUPABASE_KEY = "내_수파베이스_ANON_KEY";

// @ts-ignore
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function App() {
  const [template, setTemplate] = useState('수파베이스에서 양식을 불러오는 중...');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 페이지 열리자마자 수파베이스에서 내가 저장한 프롬프트 틀 가져오기
  useEffect(() => {
    if (!supabaseClient) return;
    async function loadTemplate() {
      const { data, error } = await supabaseClient
        .from('notes')
        .select('content')
        .order('created_at', { ascending: true })
        .limit(1);

      if (!error && data && data.length > 0) {
        setTemplate(data[0].content);
      } else {
        setTemplate('저장된 양식이 없거나 불러오지 못했습니다.');
      }
    }
    loadTemplate();
  }, []);

  // [저장하기] 버튼 클릭 시 실행
  const handleSave = async () => {
    if (!supabaseClient) return;
    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요!');
      return;
    }

    const { error } = await supabaseClient
      .from('notes')
      .insert([{ title, content }]);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert('🎉 수파베이스 저장 성공! 데이터베이스에 기록되었습니다.');
      setTitle('');
      setContent('');
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, sans-serif', maxWidth: '700px', margin: '40px auto', padding: '0 20px', color: '#333' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '20px', textAlign: 'center' }}>🌐 공유형 AI 노트 저장소</h1>
        
        <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '25px', borderLeft: '5px solid #24b47e' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#0f172a' }}>💡 추천 프롬프트 가이드 (복사해서 AI 스튜디오에 쓰세요!)</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>아래 양식을 복사해 AI 스튜디오에서 노트를 만든 뒤, 하단에 저장해 보세요.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '13px', background: '#e2e8f0', padding: '10px', borderRadius: '4px', margin: '5px 0' }}>{template}</pre>
        </div>

        <hr style={{ border: 0, height: '1px', background: '#e2e8f0', marginBottom: '25px' }} />

        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569' }}>✍️ 노트 제목</label>
        <input 
          type="text" 
          placeholder="예: [홍길동] 마케팅 1강 정리" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px' }}
        />

        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569' }}>📝 마크다운 본문 (결과물 붙여넣기)</label>
        <textarea 
          placeholder="AI 스튜디오가 만들어준 최종 노트를 여기에 붙여넣으세요..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', height: '200px', padding: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'monospace' }}
        />

        <button 
          onClick={handleSave}
          style={{ width: '100%', padding: '14px', background: '#24b47e', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px' }}
        >
          수파베이스 데이터베이스에 저장하기
        </button>
      </div>
    </div>
  );
}

export default App;
