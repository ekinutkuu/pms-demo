export const getOverlapQuery = (startDate: Date, endDate: Date) => {
    return {
        start_date: { $lt: endDate },
        end_date: { $gt: startDate }
    };
};
