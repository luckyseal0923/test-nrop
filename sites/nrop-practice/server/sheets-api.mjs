const methods = new Set(['nrop_public_config', 'nrop_list_records', 'nrop_list_openings', 'nrop_save_record', 'nrop_set_opening', 'nrop_list_bed_capacities', 'nrop_admin_bed_settings', 'nrop_prepare_bed_change', 'nrop_confirm_bed_change', 'nrop_admin_audit']);
export function nropMiddleware(env, remoteFetch = fetch) {
  const configured = !!env.SHEETS_API_URL && !!env.SHEETS_API_TOKEN;
  return async (req, res, next = () => { res.writeHead(404); res.end(); }) => {
    const path = req.url?.split('?')[0];
    if (!['/api/connection', '/api/nrop'].includes(path)) return next();
    const reply = (code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    // 此模板只供本機使用。拒絕跨來源頁面借用本機代理。
    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host || '') || (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host)) return reply(403, { error: { message: '僅允許本機同來源操作' } });
    if (path === '/api/connection' && req.method === 'GET') return reply(200, { configured, spreadsheetUrl: env.SHEETS_DOCUMENT_URL || '' });
    if (req.method !== 'POST') return reply(405, { error: { message: '不支援的請求方法' } });
    if (!configured) return reply(503, { error: { message: 'Google 試算表尚未連接，請完成 README 的 Apps Script 設定。' } });
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.SHEETS_API_URL)) return reply(503, { error: { message: 'SHEETS_API_URL 必須是 Apps Script 部署的 /exec 網址' } });
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 32000) return reply(413, { error: { message: '資料超過大小限制' } }); }
      const input = JSON.parse(raw);
      if (!methods.has(input.method)) return reply(400, { error: { message: '不支援的資料操作' } });
      const response = await remoteFetch(env.SHEETS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: env.SHEETS_API_TOKEN, method: input.method, params: input.params || {} }), signal: AbortSignal.timeout(45000), redirect: 'follow' });
      if (!response.ok) throw new Error('Google 讀寫服務回應異常');
      const result = await response.json();
      if (!result || (result.error && typeof result.error.message !== 'string') || (!Object.hasOwn(result, 'data') && !result.error)) throw new Error('讀寫服務回傳格式不符');
      reply(200, result);
    } catch (error) {
      reply(502, { error: { message: error instanceof SyntaxError ? '讀寫服務未回傳 JSON，請檢查 Apps Script 部署與存取權限。' : 'Google 試算表暫時無法連線，請確認設定後重試。' } });
    }
  };
}
