interface MiniLoaderProps {
    color?: string;
}

export default function MiniLoader({ color }: MiniLoaderProps) {
    const style: React.CSSProperties = {};
    if (color) {
        style.borderTopColor = color;
    }

    return (
        <div className="loader" style={style}></div>
    )
}
