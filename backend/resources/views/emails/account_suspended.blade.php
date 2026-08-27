<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #e53e3e;">Akun Anda Ditangguhkan</h2>
        <p>Halo <strong>{{ $user->name }}</strong>,</p>
        <p>Mohon maaf, kami mendeteksi adanya pelanggaran terhadap syarat dan ketentuan platform BumDesMartNukita sehingga akun Anda untuk sementara waktu ditangguhkan.</p>
        
        <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #c53030;">Alasan Penangguhan:</h4>
            <p style="margin-bottom: 0;">{{ $reason }}</p>
        </div>

        <p>Selama akun ditangguhkan, Anda tidak akan dapat masuk (login) ke platform BumDesMartNukita.</p>
        <p>Jika Anda merasa ini adalah sebuah kesalahan, Anda dapat mengajukan permohonan pengaktifan kembali (appeal) melalui tautan di bawah ini:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/appeal" style="background-color: #4a5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ajukan Pengaktifan Kembali</a>
        </div>

        <p>Tim BumDesMartNukita</p>
    </div>
</body>
</html>
