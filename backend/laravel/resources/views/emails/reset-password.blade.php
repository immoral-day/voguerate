<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сброс пароля — Voguerate</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border: 2px solid #000; box-shadow: 4px 4px 0 #000; }
        .header { background: #FFE55C; border-bottom: 2px solid #000; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
        .body { padding: 32px; }
        .body p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; }
        .btn { display: inline-block; background: #FFE55C; border: 2px solid #000; box-shadow: 3px 3px 0 #000; padding: 14px 28px; font-weight: 900; font-size: 14px; text-transform: uppercase; text-decoration: none; color: #000; letter-spacing: 1px; }
        .btn-wrap { text-align: center; margin: 24px 0; }
        .note { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; }
        .url-fallback { word-break: break-all; font-size: 11px; color: #444; background: #f5f5f5; padding: 8px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Voguerate</h1>
        </div>
        <div class="body">
            <p>Привет, <strong>{{ $username }}</strong>!</p>
            <p>Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы задать новый пароль:</p>
            <div class="btn-wrap">
                <a href="{{ $resetUrl }}" class="btn">Сбросить пароль</a>
            </div>
            <p>Ссылка действительна <strong>60 минут</strong>. Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
            <div class="note">
                <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
                <p class="url-fallback">{{ $resetUrl }}</p>
            </div>
        </div>
    </div>
</body>
</html>
