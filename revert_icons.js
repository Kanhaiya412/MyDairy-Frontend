const fs = require('fs');
let file = fs.readFileSync('e:/MyDairyApp/MyDairy-Frontend/src/screens/FarmerHome.tsx', 'utf8');

file = file.replace("import LinearGradient from 'react-native-linear-gradient';\nimport MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';", "import LinearGradient from 'react-native-linear-gradient';");
file = file.replace("<MaterialCommunityIcons name={icon} size={28} color={theme.brandStrong} />", "<Text style={styles.quickIcon}>{icon}</Text>");
file = file.replace("<MaterialCommunityIcons name=\"check\" size={16} color=\"#FFFFFF\" />", "<Text style={styles.check}>✓</Text>");
file = file.replace("<MaterialCommunityIcons name=\"close\" size={24} color={theme.textMuted} />", "<Text style={styles.closeIcon}>✕</Text>");
file = file.replace("<MaterialCommunityIcons name=\"cow\" size={50} color={theme.brandStrong} />", "<Text style={styles.pEmoji}>🥛</Text>");

// Quick array
file = file.replace("icon: 'water-plus'", "icon: '🥛'");
file = file.replace("icon: 'chart-bar'", "icon: '📊'");
file = file.replace("icon: 'cash-plus'", "icon: '💸'");
file = file.replace("icon: 'cow'", "icon: '🐄'");
file = file.replace("icon: 'currency-inr'", "icon: '💰'");

// Header
file = file.replace("<MaterialCommunityIcons name=\"menu\" size={28} color={theme.text} />", "<Text style={styles.menuIcon}>☰</Text>");
file = file.replace("<MaterialCommunityIcons name=\"storefront-outline\" size={26} color={theme.brandStrong} />", "<Text style={styles.avatarEmoji}>🥛</Text>");
file = file.replace("<MaterialCommunityIcons name=\"bell-outline\" size={24} color={theme.text} />", "<Text style={styles.bell}>🔔</Text>");
file = file.replace("<MaterialCommunityIcons name=\"account-outline\" size={24} color={theme.text} />", "<Text style={styles.userIcon}>👤</Text>");

// Shifts
file = file.replace("<Text style={styles.shiftTitle}><MaterialCommunityIcons name=\"weather-sunset-up\" size={16} color={theme.textMuted} /> Morning</Text>", "<Text style={styles.shiftTitle}>🌅 Morning</Text>");
file = file.replace("<Text style={styles.shiftTitle}><MaterialCommunityIcons name=\"weather-sunset-down\" size={16} color={theme.textMuted} /> Evening</Text>", "<Text style={styles.shiftTitle}>🌇 Evening</Text>");

// Fabs
file = file.replace("<MaterialCommunityIcons name=\"plus\" size={32} color=\"#FFFFFF\" />", "<Text style={styles.fabPlus}>＋</Text>");
file = file.replace("<MaterialCommunityIcons name=\"robot-outline\" size={32} color=\"#FFFFFF\" />", "<Text style={styles.aiIcon}>🤖</Text>");

fs.writeFileSync('e:/MyDairyApp/MyDairy-Frontend/src/screens/FarmerHome.tsx', file);
console.log('FarmerHome.tsx restored to emojis');
