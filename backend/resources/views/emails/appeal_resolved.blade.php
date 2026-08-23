<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        @if($appeal->status === 'approved')
            <h2 style="color: #38a169;">Akun Anda Telah Aktif Kembali</h2>
            <p>Halo,</p>
            <p>Kabar baik! Pengajuan pengaktifan kembali akun Anda telah <strong>disetujui</strong> oleh Admin kami. Akun Anda saat ini sudah diaktifkan kembali dan Anda dapat menggunakannya seperti biasa.</p>
            <p>Terima kasih atas kesabaran dan kerjasamanya.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/login" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Masuk Sekarang</a>
            </div>
        @else
            <h2 style="color: #e53e3e;">Informasi Pengajuan Akun</h2>
            <p>Halo,</p>
            <p>Mohon maaf, setelah meninjau kembali pengajuan Anda, Admin kami memutuskan untuk <strong>menolak</strong> pengaktifan kembali akun Anda pada saat ini.</p>
            
            @if($appeal->admin_note)
            <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #c53030;">Catatan Admin:</h4>
                <p style="margin-bottom: 0;">{{ $appeal->admin_note }}</p>
            </div>
            @endif

            <p>Keputusan ini bersifat final. Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim dukungan kami.</p>
        @endif

        <p>Tim BUMDESMart</p>
    </div>
</body>
</html>
