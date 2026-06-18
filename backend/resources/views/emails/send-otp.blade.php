<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=index">
    <title>Kode OTP Reset Password</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 32px;
            color: #374151;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 24px 0;
            font-size: 16px;
        }
        .otp-container {
            background-color: #f0fdf4;
            border: 2px dashed #86efac;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 800;
            color: #15803d;
            letter-spacing: 8px;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #f3f4f6;
            font-size: 13px;
            color: #9ca3af;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #10b981;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BUMDESMart</h1>
        </div>
        <div class="content">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk menyetel ulang kata sandi akun BUMDESMart Anda. Silakan gunakan kode OTP di bawah ini untuk melanjutkan proses reset password:</p>
            
            <div class="otp-container">
                <h2 class="otp-code">{{ $otp }}</h2>
            </div>
            
            <p>Kode OTP ini hanya berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.</p>
            <p>Jika Anda tidak meminta pengaturan ulang kata sandi ini, Anda dapat mengabaikan email ini dengan aman.</p>
            <p>Terima kasih,<br>Tim Dukungan BUMDESMart</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} BUMDESMart. Semua Hak Dilindungi.</p>
            <p>Butuh bantuan? <a href="mailto:support@bumdesmart.id">Hubungi Dukungan</a></p>
        </div>
    </div>
</body>
</html>
