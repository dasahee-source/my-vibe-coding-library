import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/index.html", import.meta.url);

test("정적 페이지에 완성된 도서관 정보가 포함된다", async () => {
  const html = await readFile(output, "utf8");

  assert.match(html, /<html lang="ko">/);
  assert.match(html, /나의 바이브코딩 도서관/);
  assert.match(html, /프롬프트부터 완성작까지/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});
