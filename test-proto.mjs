import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('design/index.html', 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'http://localhost/'
});
const { window } = dom;
const { document } = window;

let failed = false;
function assert(cond, msg) {
  if (!cond) { console.error('  FAIL: ' + msg); failed = true; }
  else { console.log('  PASS: ' + msg); }
}
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const mouse = (el, type, x, y) => el.dispatchEvent(new window.MouseEvent(type, { bubbles: true, clientX: x || 0, clientY: y || 0 }));
function connect(outSel, inSel) {
  mouse(document.querySelector(outSel), 'mousedown', 200, 200);
  mouse(document.querySelector(inSel), 'mouseup', 700, 320);
}

window.addEventListener('load', () => {
  setTimeout(() => {
    try {
      // ---- 1) Settings modal ----
      const setBtn = document.getElementById('apiSettingsBtn');
      click(setBtn);
      const modal = document.getElementById('settingsModal');
      assert(modal.classList.contains('open'), '设置弹窗打开');
      document.getElementById('setApiKey').value = 'sk-test-123';
      click(document.getElementById('settingsSave'));
      assert(!modal.classList.contains('open'), '保存后弹窗关闭');
      click(setBtn);
      assert(document.getElementById('setApiKey').value === 'sk-test-123', '重新打开回填已保存值');
      click(document.getElementById('settingsCancel'));

      // ---- 2) Node delete ----
      let before = document.querySelectorAll('.node-card').length;
      assert(before === 4, '初始节点数 = 4');
      let beforeConn = document.querySelectorAll('.connection-path').length;
      assert(beforeConn === 3, '初始连线数 = 3');
      click(document.querySelector('.node-delete[data-del="n3"]'));
      let after = document.querySelectorAll('.node-card').length;
      assert(after === before - 1, '删除节点生效');
      let afterConn = document.querySelectorAll('.connection-path').length;
      assert(afterConn === beforeConn - 3, '删除节点连带移除连线 (after ' + afterConn + ')');

      // ---- 3) Right-click add node ----
      const canvasEl = document.getElementById('canvas');
      canvasEl.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, clientX: 500, clientY: 400 }));
      const ctxMenu = document.getElementById('ctxMenu');
      assert(ctxMenu.style.display === 'block', '右键弹出菜单');
      const beforeAdd = document.querySelectorAll('.node-card').length;
      click(ctxMenu.querySelector('.ctx-item[data-type="image"]'));
      assert(document.querySelectorAll('.node-card').length === beforeAdd + 1, '右键添加节点生效');
      assert(ctxMenu.style.display === 'none', '添加后菜单关闭');

      // ---- 4) Drag to connect ----
      connect('.port.output[data-port="n2-o2"]', '.port.input[data-port="n4-i4"]');
      const connAfter = document.querySelectorAll('.connection-path').length;
      assert(connAfter === 1, '拖拽连线生效 (count ' + connAfter + ')');

      // ===== connection deletion =====
      // 4a) click selects + handle appears
      click(document.querySelector('.connection-path[data-idx="0"]'));
      assert(document.querySelector('.connection-path[data-idx="0"]').classList.contains('selected'), '点击连线高亮选中');
      assert(!!document.querySelector('.conn-delete'), '选中后显示删除按钮');

      // 4b) delete via handle button
      let beforeBtn = document.querySelectorAll('.connection-path').length;
      click(document.querySelector('.conn-delete'));
      assert(document.querySelectorAll('.connection-path').length === beforeBtn - 1, '点击按钮删除连线');
      assert(!document.querySelector('.conn-delete'), '删除后按钮消失');

      // 4c) delete via Delete key (recreate first)
      connect('.port.output[data-port="n2-o2"]', '.port.input[data-port="n4-i4"]');
      click(document.querySelector('.connection-path[data-idx="0"]'));
      assert(!!document.querySelector('.conn-delete'), '再次选中显示按钮');
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      assert(!document.querySelector('.conn-delete'), 'Delete 键删除连线');
      assert(!document.querySelector('.connection-path.selected'), 'Delete 后无选中');

      // 4d) selecting a node clears connection selection
      connect('.port.output[data-port="n2-o2"]', '.port.input[data-port="n4-i4"]');
      click(document.querySelector('.connection-path[data-idx="0"]'));
      assert(!!document.querySelector('.conn-delete'), '连线选中');
      click(document.querySelector('.node-card'));
      assert(!document.querySelector('.conn-delete'), '选中节点后清空连线选中');

      // 4e) clicking empty canvas deselects
      click(document.querySelector('.connection-path[data-idx="0"]'));
      assert(!!document.querySelector('.conn-delete'), '连线选中');
      click(document.getElementById('nodes'));
      assert(!document.querySelector('.conn-delete'), '点击空白处取消选中');

      if (failed) { console.error('\n=== TESTS FAILED ==='); process.exit(1); }
      else { console.log('\n=== ALL TESTS PASSED ==='); process.exit(0); }
    } catch (e) {
      console.error('TEST ERROR:', e.stack || e.message);
      process.exit(1);
    }
  }, 200);
});
