import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

interface BreakdownRequestBody {
  taskId?: number;
}

export async function POST(request: Request) {
  let body: BreakdownRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const taskId = body.taskId;
  if (typeof taskId !== "number") {
    return NextResponse.json({ error: "taskIdが指定されていません" }, { status: 400 });
  }

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, assignee, due_date")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  }

  let responseText: string;
  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "あなたはプロジェクトマネージャーのアシスタントです。" +
        "与えられたタスクを実行するための具体的な工程を4〜6ステップ程度で洗い出してください。" +
        "説明文やコードブロック記号なしで、JSON配列のみを返してください。" +
        '配列の各要素は工程名を表す文字列にしてください。例: ["要件整理", "設計", "実装", "レビュー", "リリース"]',
      messages: [
        {
          role: "user",
          content:
            `タスク名: ${task.title}\n` +
            `担当者: ${task.assignee || "未定"}\n` +
            `期限: ${task.due_date || "未定"}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AIから有効な応答が得られませんでした" },
        { status: 502 }
      );
    }
    responseText = textBlock.text;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEYが正しく設定されていません" },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "AI APIのレート制限に達しました。しばらくして再試行してください" },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI APIエラー: ${err.message}` },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json(
      { error: `ANTHROPIC_API_KEYが正しく設定されていません: ${message}` },
      { status: 500 }
    );
  }

  let steps: string[];
  try {
    const cleaned = responseText
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    steps = parsed.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
    if (steps.length === 0) throw new Error("empty");
  } catch {
    return NextResponse.json(
      { error: "AIの応答をJSONとして解析できませんでした" },
      { status: 502 }
    );
  }

  const { error: deleteError } = await supabase
    .from("subtasks")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("subtasks")
    .insert(steps.map((title, index) => ({ task_id: taskId, title, sort_order: index })))
    .select("*");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ subtasks: inserted });
}
