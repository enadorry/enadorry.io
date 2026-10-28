(async () => {
  const form = document.getElementById('settings-form'), status = document.getElementById('status'), signin = document.getElementById('signin'), save = document.getElementById('save');
  const x = document.getElementById('x-visible'), instagram = document.getElementById('instagram-visible');
  try {
    const response = await fetch('/api/social-settings', { cache: 'no-store' });
    if (!response.ok) throw Error();
    const data = await response.json();
    if (!data.canManage) { status.textContent = 'サイト所有者のChatGPTアカウントでログインしてください。'; signin.hidden = false; return; }
    x.checked = data.xVisible; instagram.checked = data.instagramVisible; form.hidden = false; status.textContent = '現在の設定です。変更して保存してください。';
  } catch { status.textContent = '設定を読み込めませんでした。ページを再読み込みしてください。'; return; }
  form.addEventListener('submit', async event => {
    event.preventDefault(); save.disabled = true; status.textContent = '保存中…';
    try {
      const response = await fetch('/api/social-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ xVisible: x.checked, instagramVisible: instagram.checked }) });
      if (response.status === 403) { status.textContent = 'ログインを確認して、もう一度保存してください。'; signin.hidden = false; }
      else if (!response.ok) throw Error();
      else status.textContent = '保存しました。サイトの再読み込み、または最大約1分で反映されます。';
    } catch { status.textContent = '保存できませんでした。設定は変更されていません。もう一度お試しください。'; }
    finally { save.disabled = false; }
  });
})();
