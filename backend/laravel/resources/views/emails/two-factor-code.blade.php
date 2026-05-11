<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Код входа — Voguerate</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border: 2px solid #000; box-shadow: 4px 4px 0 #000; }
        .header { background: #FFE55C; border-bottom: 2px solid #000; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
        .body { padding: 32px; }
        .body p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; }
        .code-box { background: #FFE55C; border: 2px solid #000; box-shadow: 3px 3px 0 #000; padding: 20px; text-align: center; margin: 24px 0; }
        .code { font-size: 48px; font-weight: 900; letter-spacing: 0.3em; color: #000; }
        .note { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Voguerate</h1>
        </div>
        <div class="body">
            <p>Привет, <strong>{{ $username }}</strong>!</p>
            <p>Ваш код для входа в аккаунт:</p>
            <div class="code-box">
                <div class="code">{{ $code }}</div>
            </div>
            <p>Код действителен <strong>10 минут</strong>. Никому не сообщайте этот код.</p>
            <div class="note">
                <p>Если вы не пытались войти в Voguerate, просто проигнорируйте это письмо.</p>
            </div>
        </div>
    </div>
</body>
</html>
