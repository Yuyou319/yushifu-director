/**
 * 安全复制文本：
 * 1. 优先用 Clipboard API；
 * 2. 失败（无权限 / 非安全上下文 / 用户拒权）时降级到 execCommand；
 * 3. 全程吞掉异常，绝不产生未处理的 Promise 拒绝。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 忽略，走降级方案 */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
