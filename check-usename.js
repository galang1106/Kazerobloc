import fetch from "node-fetch";
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    const { username } = req.body;
    if (!username || username.trim().length === 0) {
        return res.status(400).json({
            error: "Username is required",
            exists: false
        });
    }
    const cleanUsername = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
        return res.status(400).json({
            error: "Username tidak valid. Harus 3-20 karakter, hanya huruf, angka, dan underscore.",
            exists: false
        });
    }
    try {
        const response = await fetch(
            `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const data = await response.json();
        if (data.Id) {
            try {
                const avatarResponse = await fetch(
                    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${data.Id}&size=48x48&format=Png&isCircular=false`
                );
                const avatarData = await avatarResponse.json();

                let avatarUrl = null;
                if (avatarData.data && avatarData.data.length > 0) {
                    avatarUrl = avatarData.data[0].imageUrl;
                }

                return res.status(200).json({
                    exists: true,
                    userId: data.Id,
                    username: data.Username,
                    avatarUrl: avatarUrl,
                    message: "Username ditemukan!"
                });
            } catch (avatarError) {
                return res.status(200).json({
                    exists: true,
                    userId: data.Id,
                    username: data.Username,
                    avatarUrl: null,
                    message: "Username ditemukan!"
                });
            }
        } else {
            return res.status(404).json({
                exists: false,
                error: "Username tidak ditemukan di Roblox",
                message: "Username tidak terdaftar"
            });
        }
    } catch (error) {
        try {
            const fallbackResponse = await fetch(
                "https://users.roblox.com/v1/usernames/users",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usernames: [cleanUsername], excludeBannedUsers: false })
                }
            );
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.data && fallbackData.data.length > 0) {
                const user = fallbackData.data[0];
                try {
                    const avatarResponse = await fetch(
                        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=48x48&format=Png&isCircular=false`
                    );
                    const avatarData = await avatarResponse.json();
                    let avatarUrl = null;
                    if (avatarData.data && avatarData.data.length > 0) {
                        avatarUrl = avatarData.data[0].imageUrl;
                    }
                    return res.status(200).json({
                        exists: true,
                        userId: user.id,
                        username: user.name,
                        avatarUrl: avatarUrl,
                        message: "Username ditemukan!"
                    });
                } catch {
                    return res.status(200).json({
                        exists: true,
                        userId: user.id,
                        username: user.name,
                        avatarUrl: null,
                        message: "Username ditemukan!"
                    });
                }
            } else {
                return res.status(404).json({
                    exists: false,
                    error: "Username tidak ditemukan di Roblox"
                });
            }
        } catch (fallbackError) {
            return res.status(500).json({
                error: "Gagal memeriksa username. Coba lagi nanti.",
                exists: null
            });
        }
    }
}
