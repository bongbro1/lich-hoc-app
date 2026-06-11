import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export const WORK_SUGGESTIONS = [
    'FPT Software',
    'Tập đoàn Viettel',
    'VNG Corporation',
    'Ví điện tử MoMo',
    'Samsung Electronics R&D',
    'Grab Việt Nam',
    'Shopee Việt Nam',
    'Công ty Công nghệ Toàn Cầu',
    'KMS Technology',
    'FPT Telecom',
    'Tập đoàn VinGroup',
    'Tiki Việt Nam',
    'Zalo Group',
    'Ngân hàng Vietcombank',
    'Ngân hàng Techcombank',
    'Tập đoàn VNPT',
    'Tập đoàn FPT',
    'NashTech Việt Nam',
    'One Mount Group',
    'Tập đoàn Sun Group',
    'Ngân hàng MB Bank',
    'Ngân hàng BIDV',
    'Ngân hàng Agribank',
    'Ngân hàng VietinBank',
    'Tập đoàn Viễn thông VNPT',
    'Công ty Cổ phần MISA',
    'Lazada Việt Nam',
    'Tập đoàn Masan',
    'Tập đoàn Hòa Phát',
    'Vinamilk Việt Nam',
    'Sendo Việt Nam',
    'Gotec Land',
    'Tập đoàn Novaland',
    'Cốc Cốc',
    'ZaloPay',
    'AhaMove Việt Nam',
    'Giao Hàng Nhanh (GHN)',
    'Giao Hàng Tiết Kiệm (GHTK)'
];

export const SCHOOL_SUGGESTIONS = [
    'Đại học Bách Khoa TP.HCM',
    'Đại học Bách Khoa Hà Nội',
    'Đại học Công nghệ Thông tin - ĐHQG-HCM',
    'Đại học Khoa học Tự nhiên - ĐHQG-HCM',
    'Đại học Khoa học Tự nhiên - ĐHQG Hà Nội',
    'Đại học Ngoại thương Hà Nội',
    'Đại học Ngoại thương TP.HCM',
    'Đại học Kinh tế Quốc dân',
    'Đại học Sư phạm Kỹ thuật TP.HCM',
    'Đại học FPT',
    'Đại học Tôn Đức Thắng',
    'Đại học RMIT Việt Nam',
    'Đại học Quốc tế - ĐHQG-HCM',
    'Đại học Kinh tế TP.HCM',
    'Đại học Quốc gia Hà Nội',
    'Đại học Quốc gia TP.HCM',
    'Đại học Công nghiệp TP.HCM',
    'Đại học Sài Gòn',
    'Đại học Mở TP.HCM',
    'Đại học Hoa Sen',
    'Đại học HUTECH',
    'Đại học Duy Tân',
    'Đại học Cần Thơ',
    'Đại học Đà Nẵng',
    'Đại học Luật TP.HCM',
    'Đại học Luật Hà Nội',
    'Đại học Y Dược TP.HCM',
    'Đại học Y Hà Nội',
    'THPT Chuyên Lê Quý Đôn',
    'THPT Chuyên Hùng Vương',
    'THPT Chuyên Phan Bội Châu',
    'THPT Chuyên Hà Nội - Amsterdam',
    'THPT Chuyên Lê Hồng Phong TP.HCM',
    'THPT Chuyên Trần Đại Nghĩa',
    'THPT Chuyên Lê Hồng Phong Nam Định',
    'THPT Chuyên Nguyễn Huệ'
];

// FULL 63 Provinces & Cities in Vietnam
export const CITY_SUGGESTIONS = [
    'Thành phố Hồ Chí Minh',
    'Thành phố Hà Nội',
    'Thành phố Đà Nẵng',
    'Thành phố Hải Phòng',
    'Thành phố Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bạc Liêu',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Định',
    'Bình Dương',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Tĩnh',
    'Hải Dương',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Thừa Thiên Huế',
    'Tiền Giang',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái',
    'Phú Yên'
];

export const RELATIONSHIP_SUGGESTIONS = [
    'Độc thân',
    'Đang hẹn hò',
    'Đã đính hôn',
    'Đã kết hôn',
    'Mối quan hệ phức tạp',
    'Đang tìm hiểu',
    'Đã ly hôn',
    'Mối quan hệ mở',
    'Đã góa'
];

export const LINK_SUGGESTIONS = [
    'instagram.com/',
    'github.com/',
    'facebook.com/',
    'linkedin.com/in/',
    'youtube.com/',
    'tiktok.com/@',
    'twitter.com/',
    't.me/',
    'medium.com/'
];

interface SuggestionHelperProps {
    query: string;
    suggestions: string[];
    onSelect: (value: string) => void;
    theme: any;
}

export const SuggestionHelper = React.memo(({ query, suggestions, onSelect, theme }: SuggestionHelperProps) => {
    const filtered = useMemo(() => {
        if (!query.trim()) {
            return suggestions.slice(0, 4);
        }
        return suggestions.filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }, [query, suggestions]);

    if (filtered.length === 0) return null;

    return (
        <View style={styles.suggestionContainer}>
            <Text style={[styles.suggestionTitle, { color: theme.textMuted }]}>Gợi ý phổ biến:</Text>
            <View style={styles.suggestionBadgeRow}>
                {filtered.map((item, idx) => (
                    <Pressable
                        key={idx}
                        onPress={() => onSelect(item)}
                        style={({ pressed }) => [
                            styles.suggestionBadge,
                            {
                                backgroundColor: theme.primaryBg,
                                borderColor: theme.border,
                                opacity: pressed ? 0.8 : 1
                            }
                        ]}
                    >
                        <Text style={[styles.suggestionBadgeText, { color: theme.primary }]}>{item}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    suggestionContainer: {
        marginTop: 10,
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    suggestionTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    suggestionBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 0.5,
    },
    suggestionBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
