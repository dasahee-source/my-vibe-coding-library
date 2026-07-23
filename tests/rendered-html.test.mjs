import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/index.html", import.meta.url);

test("정적 페이지에 프로그램 도서관 정보가 포함된다", async () => {
  const html = await readFile(output, "utf8");

  assert.match(html, /<html lang="ko">/);
  assert.match(html, /나의 바이브코딩 도서관/);
  assert.match(html, /만든 프로그램을 한눈에/);
  assert.match(html, /내 프로그램 컬렉션/);
  assert.match(html, /프로그램 실행/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});
