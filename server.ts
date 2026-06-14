import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // AI note structuring API
  app.post("/api/notes/generate", async (req, res) => {
    try {
      const { title, content, options } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "제목과 원본 내용을 모두 입력해주세요." });
      }

      if (!apiKey || !ai) {
        return res.status(500).json({ 
          error: "Gemini API 키가 설정되지 않았습니다. AI Studio 설정에서 비밀번호(Secret)를 추가해주세요." 
        });
      }

      const tone = options?.tone || "professional";
      const includeTable = options?.includeTable !== false;
      const customInstruction = options?.customInstruction || "";

      const systemInstruction = `
너는 복잡한 개념을 명확하고 구조적으로 정리하는 지식 정리 전문가(Note-taking Expert)야.
사용자가 입력한 제목과 원본 데이터를 바탕으로 최상의 가독성을 지난 마크다운 노트를 작성해 줘.

[작성 가이드라인]
1. 가독성 최우선: 한 줄 설명이나 문장이 너무 길어지지 않게 단락을 잘라라. 아주 긴 줄글은 피하고, 핵심 키워드는 반드시 **볼드체(**...**)**로 인라인 강조할 것.
2. 구조화: 복잡하거나 위계가 있는 정보는 글머리 기호(List bullet: *, -)와 번호 매기기를 2레벨 또는 3레벨 깊이로 적절히 들여쓰기하여 구조화할 것.
3. 시각화: 개념 간의 비교, 데이터, 카테고리별 요약 등이 있다면 반드시 Markdown 표(Table)를 생성해서 정리할 것.
4. 핵심 요약: 가장 귀중한 단서, 실무 팁, 혹은 핵심 주의사항은 '> 인용구(Blockquote)' 형식을 사용할 것.
5. 언어 및 말투: 사용자가 입력한 제목과 본문에 기반하여 친숙하고 정교한 한국어로 출력할 것.
   - 신뢰받는 비즈니스 지식 도우미 어조: 'professional'일 때 ("~입니다", "~하며" 등 정결하고 간결성 추구)
   - 친근한 튜터 어조: 'friendly'일 때 ("~해요", "~해보세요!"와 같이 부담 없는 문구 사용)
   - 격식 있는 연구소 논문 어조: 'academic'일 때 ("~이다", "~으로 규명됨" 등 격조 높고 분석적인 완성도)
   현재 선택된 어조: [${tone}]

${customInstruction ? `추가 사용자 지정 요청사항 (이 요청사항을 가장 우선순위로 반영하여 가독성을 극대화할 것): "${customInstruction}"` : ""}

[출력 마크다운 규칙]
반드시 다음 구조 양식을 엄격히 준수하여 마크다운 완성본만을 반환하고, 시작 전이나 끝난 후 잡담이나 안내 코멘트(예: "네, 요약해드렸습니다" 등)를 절대로 붙이지 마세요.

# [노트 제목]
> **한 줄 요약:** [이 노트의 핵심 요약을 단 한 문장으로 제시]

## 📌 핵심 개념 정의
*   **개념 1:** [간결하고 명쾌한 개념 설명]
*   **개념 2:** [간결하고 명쾌한 개념 설명]

## 🛠️ 주요 특징 및 구조
1.  **[주요 핵심 특징 또는 구조체 큰 주제 1]**
    *   세부 내용 및 해설 A
    *   세부 내용 및 해설 B
2.  **[주요 핵심 특징 또는 구조체 큰 주제 2]**
    *   세부 내용 및 해설 A

## 📊 비교 및 분석
${includeTable ? `| 구분 | 핵심 항목 A | 핵심 항목 B |
| :--- | :--- | :--- |
| **핵심 설명** | 내용 | 내용 |
| **적용 방향** | 내용 | 내용 |
| **장단점** | 내용 | 내용 |` : "[개념 간의 상세 비교 또는 구체적 특징 구분]"}

## 💡 핵심 요약 및 Takeaway
> **Key Point:** 이 주제에 대해서 독자가 반드시 기억하고 머리에 각인해야 할 최고의 실무/이론 핵심 메시지 1~2개
`;

      const prompt = `
[주제 및 제목]
${title}

[원본 데이터 (요약 가공할 텍스트)]
${content}
`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.35, // Low temperature for consistent adherence to structures
        }
      });

      const responseText = result.text || "";
      res.json({ result: responseText });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "AI 변환 중에 예기치 못한 에러가 발생했습니다." });
    }
  });

  // Vite development vs production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
