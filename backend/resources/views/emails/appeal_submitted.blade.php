<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2b6cb0;">Pengajuan Pengaktifan Akun Baru</h2>
        <p>Halo Admin,</p>
        <p>Terdapat satu pengajuan pengaktifan kembali akun (appeal) baru yang masuk dan perlu ditinjau.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Email</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $appeal->email }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top;">Alasan</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $appeal->reason }}</td>
            </tr>
        </table>

        <p>Silakan masuk ke Dashboard Super Admin untuk meninjau dan merespons pengajuan ini.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/admin/appeals" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Lihat di Dashboard</a>
        </div>
    </div>
</body>
</html>
