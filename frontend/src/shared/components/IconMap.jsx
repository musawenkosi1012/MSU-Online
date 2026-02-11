import React from 'react';
import {
    Database,
    Globe,
    BookOpen,
    Layout,
    Brain,
    Zap,
    Sparkles
} from 'lucide-react';

const IconMap = ({ name, className }) => {
    const icons = {
        Database: <Database className={className} />,
        Globe: <Globe className={className} />,
        BookOpen: <BookOpen className={className} />,
        Layout: <Layout className={className} />,
        Brain: <Brain className={className} />,
        Zap: <Zap className={className} />,
        Sparkles: <Sparkles className={className} />
    };
    return icons[name] || <BookOpen className={className} />;
};

export default IconMap;
