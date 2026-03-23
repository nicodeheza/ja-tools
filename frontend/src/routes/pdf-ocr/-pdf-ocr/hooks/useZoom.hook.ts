import {useState, useEffect} from 'react'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.1
const ZOOM_MAX = 5.0

type UseZoomReturn = {zoom: number}

export function useZoom(): UseZoomReturn {
    const [zoom, setZoom] = useState(1)

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey) return
            event.preventDefault()
            setZoom((prev) => {
                const next = event.deltaY < 0 ? prev + ZOOM_STEP : prev - ZOOM_STEP
                return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat(next.toFixed(2))))
            })
        }

        window.addEventListener('wheel', handleWheel, {passive: false})
        return () => window.removeEventListener('wheel', handleWheel)
    }, [])

    return {zoom}
}
