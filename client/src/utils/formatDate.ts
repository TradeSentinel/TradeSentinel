import { Timestamp } from 'firebase/firestore';

export const formatFirestoreTimestamp = (timestamp: any): string => {
    if (!timestamp) {
        return 'Date not available';
    }

    let date: Date;
    // Firestore Timestamps have toDate(), but if it's already a Date object (e.g., from mock data or elsewhere), use it directly.
    // Also, Firestore Timestamps might come as an object with seconds and nanoseconds from Firestore directly in some cases before full object conversion.
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp.seconds && typeof timestamp.seconds === 'number') {
        date = new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        try {
            // Try to parse if it's a string date (less ideal, but for robustness)
            date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
        } catch (e) {
            return 'Invalid date format';
        }
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false, // Use 24-hour format like "14:57"
    });
}; 