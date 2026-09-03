import { copyText } from '../lib/clipboard';

export default function PromptCompare({
  original,
  master,
  diff,
  masterName
}: {
  original: string;
  master: string;
  diff: string[];
  masterName: string;
}) {
  const copy = (t: string) => {
    void copyText(t);
  };
  return (
    <div className="cmp">
      <div className="cmp-cols">
        <div className="cmp-col">
          <div className="cmp-head">
            <span>Original · 普通版本</span>
            <button className="mini" onClick={() => copy(original)}>
              复制
            </button>
          </div>
          <pre>{original}</pre>
        </div>
        <div className="cmp-col master">
          <div className="cmp-head">
            <span>Director Master · {masterName || '大师模式'}</span>
            <button className="mini" onClick={() => copy(master)}>
              复制
            </button>
          </div>
          <pre>{master || '（未启用大师模式）'}</pre>
        </div>
      </div>
      {diff.length > 0 && (
        <div className="cmp-diff">
          <div className="cmp-head">
            <span>大师模式修改了什么</span>
          </div>
          <ul>
            {diff.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
