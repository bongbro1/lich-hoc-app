import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { configService } from '../services/configService';

export default function HelpCenterScreen() {
    const { darkMode } = useUser();
    const [loading, setLoading] = useState(true);
    const [helpConfig, setHelpConfig] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchConfig = async () => {
            const data = await configService.getHelpCenterConfig();
            if (isMounted) {
                if (data) setHelpConfig(data);
                setLoading(false);
            }
        };
        fetchConfig();
        return () => { isMounted = false; };
    }, []);

    const theme = {
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#0F172A',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#F1F5F9',
    };

    const faqs = helpConfig?.faqs || [
        {
            q: "Làm sao để xem lịch học?",
            a: "Bạn có thể xem lịch học ngay tại màn hình Trang chủ hoặc vào mục Thời gian biểu trong tab Tiện ích."
        },
        {
            q: "Dữ liệu được cập nhật từ đâu?",
            a: "Dữ liệu được lấy trực tiếp từ cổng thông tin sinh viên của trường. Bạn có thể nhấn nút làm mới để cập nhật dữ liệu mới nhất."
        },
        {
            q: "Tôi có thể đổi mật khẩu không?",
            a: "Hiện tại ứng dụng sử dụng tài khoản đồng bộ với hệ thống của trường. Bạn cần đổi mật khẩu tại trang web chính thức của trường."
        }
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Trung tâm trợ giúp" />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Câu hỏi thường gặp</Text>

                    {faqs.map((faq: any, index: number) => (
                        <View key={index} style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.question, { color: theme.text }]}>{faq.q}</Text>
                            <Text style={[styles.answer, { color: theme.textMuted }]}>{faq.a}</Text>
                        </View>
                    ))}

                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Liên hệ hỗ trợ</Text>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => Linking.openURL(`mailto:${helpConfig?.contact?.email || 'support@studentapp.vn'}`)}
                    >
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="email" size={24} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.contactLabel, { color: theme.text }]}>Email hỗ trợ</Text>
                            <Text style={[styles.contactValue, { color: theme.textMuted }]}>{helpConfig?.contact?.email || 'support@studentapp.vn'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 12 }]}
                        onPress={() => Linking.openURL(`tel:${helpConfig?.contact?.phone || '0123456789'}`)}
                    >
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="phone" size={24} color="#10B981" />
                        </View>
                        <View>
                            <Text style={[styles.contactLabel, { color: theme.text }]}>Hotline</Text>
                            <Text style={[styles.contactValue, { color: theme.textMuted }]}>{helpConfig?.contact?.phone || '0123 456 789'}</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    faqCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    question: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    answer: {
        fontSize: 14,
        lineHeight: 20,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    contactValue: {
        fontSize: 13,
        marginTop: 2,
    }
});
