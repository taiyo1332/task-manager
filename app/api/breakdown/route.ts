import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { todayLocalDate } from "@/lib/date";

interface BreakdownRequestBody {
  taskId?: number;
}

interface BreakdownStep {
  title: string;
  due_date: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clampDueDate(candidate: string | null, ceiling: string | null): string | null {
  if (!candidate) return null;
  if (!ceiling) return candidate;
  return candidate > ceiling ? ceiling : candidate;
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

  const today = todayLocalDate();

  let responseText: string;
  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "あなたはプロジェクトマネージャーのアシスタントです。" +
        "与えられたタスクを実行するための具体的な工程を4〜6ステップ程度で洗い出し、各工程に期限(due_date)を割り振ってください。" +
        "期限は今日以降の日付にしてください。タスク全体の期限が指定されている場合は、その日付を超えないように、" +
        "工程の内容や作業量、順序を考慮して妥当な間隔で配分してください。" +
        "タスク全体の期限が指定されていない場合は、今日の日付を起点に妥当な間隔で割り振ってください。" +
        "説明文やコードブロック記号なしで、JSON配列のみを返してください。" +
        '配列の各要素は {"title": "工程名", "due_date": "YYYY-MM-DD"} の形式にしてください。' +
        '例: [{"title": "要件整理", "due_date": "2026-09-05"}, {"title": "設計", "due_date": "2026-09-08"}]',
      messages: [
        {
          role: "user",
          content:
            `今日の日付: ${today}\n` +
            `タスク名: ${task.title}\n` +
            `担当者: ${task.assignee || "未定"}\n` +
            `タスク全体の期限: ${task.due_date || "未定"}`,
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

  let steps: BreakdownStep[];
  try {
    const cleaned = responseText
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    steps = parsed
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s) => ({
        title: typeof s.title === "string" ? s.title.trim() : "",
        due_date: typeof s.due_date === "string" && DATE_RE.test(s.due_date) ? s.due_date : null,
      }))
      .filter((s) => s.title.length > 0);
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
    .insert(
      steps.map((step, index) => ({
        task_id: taskId,
        title: step.title,
        sort_order: index,
        due_date: clampDueDate(step.due_date, task.due_date),
      }))
    )
    .select("*");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ subtasks: inserted });
}
