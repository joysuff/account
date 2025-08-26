import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.API_BASE_URL
});
const aiAnalysisPrompt = `你是一个专业的账单数据分析师，负责分析用户的收支数据。  
你的任务是根据用户提供的账单信息给出简短、合理的建议，内容应当：
1. 简明扼要，不分点列出。
2. 强调用户的收支结构，发现异常支出或潜在节省机会。
3. 对支出类别和金额敏感，尤其是高额支出或频繁小额支出。
4. 语气友好、易理解，可以给出可行的理财建议。
5. 不要输出敏感信息或假设用户身份。
6. 建议内容应当符合用户的实际情况，避免使用假设或泛泛而谈。
7. 不要输出带有Markdown格式的内容。
8. 禁止输出任何形式的换行字符（包括但不限于 '\n'、'\n\n' 等），保持文本内容连续无换行。
9. 建议内容长度控制在100字以内。
10. 建议内容应当是中文。
`;
async function aiAnalysis(data, dataType, onDelta) {
    try {
        const resp = await client.chat.completions.create({
            model: process.env.API_MODEL,
            stream: true,
            messages: [
                { role: "system", content: aiAnalysisPrompt },
                { role: "system", content: `账单数据类型：${dataType}` },
                { role: "user", content: JSON.stringify(data) }
            ],
        });
        let fullContent = '';
        for await (const part of resp) {
            const delta = part.choices?.[0]?.delta?.content;
            if (delta) {
                fullContent += delta;
                if (onDelta) onDelta(delta);
            }
        }
        return fullContent;
    } catch (err) {
        console.error('AI分析函数错误:', err);
        return '分析失败';
    }
}

export {
    aiAnalysis
}