import React, {useEffect, useRef} from "react";
import "./BackgroundAnimation.scss";

const BackgroundAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const points: { x: number; y: number; vx: number; vy: number }[] = [];
        const pointCount = Math.floor((width * height) / 5000);

        for (let i = 0; i < pointCount; i++) {
            points.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#233655";
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dx = points[i].x - points[j].x;
                    const dy = points[i].y - points[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.strokeStyle = "rgba(0,244,186,0.3)";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(points[i].x, points[i].y);
                        ctx.lineTo(points[j].x, points[j].y);
                        ctx.stroke();
                    }
                }
            }

            for (let p of points) {
                ctx.fillStyle = "#00eaff";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
            }

            requestAnimationFrame(draw);
        };

        draw();

        const resizeHandler = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resizeHandler);

        return () => {
            window.removeEventListener("resize", resizeHandler);
        };
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="bg-canvas"></canvas>
            <div className="e-mis-wrapper">
                <div className="e-mis-box">E-MIS</div>

            </div>
        </>
    );
};

export default BackgroundAnimation;
