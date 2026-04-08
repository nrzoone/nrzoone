export const getStock = (masterData, design, color, size) => {
    // 0. Check Design Logic
    const d = masterData.designs.find(x => x.name === design);
    const sRate = Number(d?.sewingRate || 0);

    // 1. Cutting Stock (Input)
    const cut = (masterData.cuttingStock || [])
        .filter(s => s.design === design && s.color === color && s.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.borka || 0),
            hijab: acc.hijab + Number(curr.hijab || 0)
        }), { borka: 0, hijab: 0 });

    // 2. Sewing Issues (Out from Cutting - ALWAYS deducts from Cutting if valid)
    const sewnIssued = (masterData.productions || [])
        .filter(p => p.type === 'sewing' && p.design === design && p.color === color && p.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.issueBorka || 0),
            hijab: acc.hijab + Number(curr.issueHijab || 0)
        }), { borka: 0, hijab: 0 });

    // 3. Stone Issues (Out from Cutting - ONLY if Sewing Rate is 0)
    let stoneIssuedDirect = { borka: 0, hijab: 0 };
    if (sRate === 0) {
        stoneIssuedDirect = (masterData.productions || [])
            .filter(p => p.type === 'stone' && p.design === design && p.color === color && p.size === size)
            .reduce((acc, curr) => ({
                borka: acc.borka + Number(curr.issueBorka || 0),
                hijab: acc.hijab + Number(curr.issueHijab || 0)
            }), { borka: 0, hijab: 0 });
    }

    // Result: Available Cutting Stock
    return {
        borka: cut.borka - sewnIssued.borka - stoneIssuedDirect.borka,
        hijab: cut.hijab - sewnIssued.hijab - stoneIssuedDirect.hijab
    };
};

export const getSewingStock = (masterData, design, color, size) => {
    const d = masterData.designs.find(x => x.name === design);
    const sRate = Number(d?.sewingRate || 0);

    // IF Sewing Rate is 0, Stone takes DIRECTLY from Cutting
    if (sRate === 0) {
        return getStock(masterData, design, color, size);
    }

    // IF Stone Rate is 0 (and Sewing Rate > 0), it skips Stone Factory (Direct Finish)
    const stRate = Number(d?.stoneRate || 0);
    if (stRate === 0) return { borka: 0, hijab: 0 };

    // STANDARD: Sewing Issued (Input for Stone) - Now includes Pending (Body Stock)
    const sewnReceived = (masterData.productions || [])
        .filter(p => p.type === 'sewing' && (p.status === 'Received' || p.status === 'Pending') && p.design === design && p.color === color && p.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.issueBorka || 0),
            hijab: acc.hijab + Number(curr.issueHijab || 0)
        }), { borka: 0, hijab: 0 });

    // Stone Issued (Out from Sewing)
    const stoneIssued = (masterData.productions || [])
        .filter(p => p.type === 'stone' && p.design === design && p.color === color && p.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.issueBorka || 0),
            hijab: acc.hijab + Number(curr.issueHijab || 0)
        }), { borka: 0, hijab: 0 });

    // Finishing Issued (Direct finishing is disabled if Stone Rate exists)
    const finishingIssued = { borka: 0, hijab: 0 };

    // Result: Available Sewn Stock for Stone (or Finishing if Stone=0)
    return {
        borka: sewnReceived.borka - stoneIssued.borka - finishingIssued.borka,
        hijab: sewnReceived.hijab - stoneIssued.hijab - finishingIssued.hijab
    };
};

export const getFinishingStock = (masterData, design, color, size) => {
    const d = masterData.designs.find(x => x.name === design);
    const stRate = Number(d?.stoneRate || 0);

    // Determine Source for Finishing
    let sourceStock = { borka: 0, hijab: 0 };

    if (stRate > 0) {
        // If Stone exists: Finishing inputs come from Stone Received
        const stoneReceived = (masterData.productions || [])
            .filter(p => p.type === 'stone' && p.status === 'Received' && p.design === design && p.color === color && p.size === size)
            .reduce((acc, curr) => ({
                borka: acc.borka + Number(curr.receivedBorka || 0),
                hijab: acc.hijab + Number(curr.receivedHijab || 0)
            }), { borka: 0, hijab: 0 });
        sourceStock = stoneReceived;
    } else {
        // If Stone Rate is 0: Finishing inputs come directly from Sewing Received
        // (Note: getSewingStock already handles deductions, so we need Raw Sewing Received here)
        // Actually, we can use getSewingStock logic but we need to receive from Sewing.
        const sewnReceived = (masterData.productions || [])
            .filter(p => p.type === 'sewing' && p.status === 'Received' && p.design === design && p.color === color && p.size === size)
            .reduce((acc, curr) => ({
                borka: acc.borka + Number(curr.receivedBorka || 0),
                hijab: acc.hijab + Number(curr.receivedHijab || 0)
            }), { borka: 0, hijab: 0 });
        sourceStock = sewnReceived;
    }

    // Deduct Already Issued to Finishing
    const finishingIssued = (masterData.productions || [])
        .filter(p => p.type === 'finishing' && p.design === design && p.color === color && p.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.issueBorka || 0),
            hijab: acc.hijab + Number(curr.issueHijab || 0)
        }), { borka: 0, hijab: 0 });

    return {
        borka: sourceStock.borka - finishingIssued.borka,
        hijab: sourceStock.hijab - finishingIssued.hijab
    };
};

export const getFinishedStock = (masterData, design, color, size) => {
    // Finished Stock = (Finishing Received) - Delivered
    // Note: If no 'finishing' entries exist for a design, we might fall back to Stone/Sewing?
    // User wants explicit "Swing -> Finish", so we should look for 'finishing' entries mainly.
    // However, for backward compatibility, if logic is hybrid, we rely on Finishing.

    // 1. Finishing Received
    const finishingReceived = (masterData.productions || [])
        .filter(p => p.type === 'finishing' && p.status === 'Received' && p.design === design && p.color === color && p.size === size)
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.receivedBorka || 0),
            hijab: acc.hijab + Number(curr.receivedHijab || 0)
        }), { borka: 0, hijab: 0 });

    // Fallback: If no finishing happened, maybe it's in old flow (Direct Stone/Sewing to Finish)
    // But since we are ENFORCING the new flow capability, we simply allow 'Finishing' to be the supply.
    // If the user hasn't done 'Finishing' entries, stock will be 0. This encourages using the new flow.
    // WAIT: For existing data, this would break 'Available for Delivery'.
    // COMPATIBILITY LOGIC:
    // If there are ANY 'finishing' entries for this design, assume Full Workflow.
    // If NO 'finishing' entries exist, use the Legacy logic (Stone/Sewing Received).

    const hasFinishingEntries = (masterData.productions || []).some(p => p.type === 'finishing' && p.design === design);

    let finished = finishingReceived;

    if (!hasFinishingEntries) {
        // LEGACY FLOW / NEW CIRCULAR FLOW (Swing Pending -> Stone -> Swing Receive)
        const d = masterData.designs.find(x => x.name === design);
        const stRate = Number(d?.stoneRate || 0);
        const ptRate = Number(d?.pataRate || 0);

        if (stRate > 0 || ptRate > 0) {
            // IF Stone or Pata exists, the FINAL step in the new flow is SWING RECEIVE.
            // (Because Swing Receive is blocked until Stone/Pata is done).
            // So we count SEWING RECEIVED as the finished stock.
            finished = (masterData.productions || [])
                .filter(p => p.type === 'sewing' && p.status === 'Received' && p.design === design && p.color === color && p.size === size)
                .reduce((acc, curr) => ({
                    borka: acc.borka + Number(curr.receivedBorka || 0),
                    hijab: acc.hijab + Number(curr.receivedHijab || 0)
                }), { borka: 0, hijab: 0 });
        } else {
            // If No Stone, Sewing Receive is also the end.
            finished = (masterData.productions || [])
                .filter(p => p.type === 'sewing' && p.status === 'Received' && p.design === design && p.color === color && p.size === size)
                .reduce((acc, curr) => ({
                    borka: acc.borka + Number(curr.receivedBorka || 0),
                    hijab: acc.hijab + Number(curr.receivedHijab || 0)
                }), { borka: 0, hijab: 0 });
        }
    }

    // 3. Deduct Deliveries
    const delivered = (masterData.deliveries || [])
        .filter(d => d.design === design && (!d.color || d.color === color) && (!d.size || d.size === size))
        .reduce((acc, curr) => ({
            borka: acc.borka + Number(curr.qtyBorka || 0),
            hijab: acc.hijab + Number(curr.qtyHijab || 0)
        }), { borka: 0, hijab: 0 });

    return {
        borka: finished.borka - delivered.borka,
        hijab: finished.hijab - delivered.hijab
    };
};

export const getStats = (masterData, type) => {
    const items = masterData.productions.filter(p => p.type === type);
    const pending = items.filter(i => i.status === 'Pending').reduce((a, b) => a + b.issueBorka + b.issueHijab, 0);
    const finished = items.filter(i => i.status === 'Received').reduce((a, b) => {
        const netBorka = b.issueBorka - (b.shortBorka || 0);
        const netHijab = b.issueHijab - (b.shortHijab || 0);
        return a + netBorka + netHijab;
    }, 0);

    const productionBill = items.filter(i => i.status === 'Received').reduce((acc, b) => {
        const design = masterData.designs.find(d => d.name === b.design);
        const netBorka = (b.receivedBorka || 0);
        const netHijab = (b.receivedHijab || 0);
        const penalty = Number(b.penalty || 0);
        const multiplier = masterData.multipliers?.[type] || 1.0;

        let earnings = 0;
        if (type === 'sewing') {
            const bRate = (design?.sewingRate || 0) * multiplier;
            const hRate = (design?.hijabRate || design?.sewingRate || 0) * multiplier;
            earnings = (netBorka * bRate) + (netHijab * hRate);
        } else if (type === 'stone') {
            const rate = (design?.stoneRate || 0) * multiplier;
            earnings = ((netBorka + netHijab) * rate);
        }
        return acc + earnings - penalty;
    }, 0);

    // Monthly worker attendance bill for this department
    const attendanceBill = masterData.attendance?.filter(a => a.department === type)
        .reduce((sum, record) => sum + (record.wage || 0), 0) || 0;

    return { pending, finished, bill: productionBill + attendanceBill };
};

export const getPataStats = (masterData) => {
    // Only count Received items for stock and bill
    const receivedEntries = (masterData.pataEntries || []).filter(e => e.status === 'Received');

    // totalAdded is actually total pieces received
    const totalAdded = receivedEntries.reduce((a, b) => a + Number(b.pataQty || 0), 0);

    // Total Spent: Based on Stone Productions (pataQty)
    const totalSpent = (masterData.productions?.filter(p => p.type === 'stone').reduce((a, b) => {
        return a + Number(b.pataQty || 0);
    }, 0) || 0);

    // Total Bill for Pata workers
    const multiplier = masterData.multipliers?.pata || 1.0;
    const pataProductionBill = receivedEntries.reduce((acc, e) => acc + (Number(e.amount || 0) * multiplier), 0);

    // Monthly worker attendance bill for pata department
    const attendanceBill = masterData.attendance?.filter(a => a.department === 'pata')
        .reduce((sum, record) => sum + (record.wage || 0), 0) || 0;

    return {
        totalAdded,
        totalSpent,
        currentStock: totalAdded - totalSpent,
        bill: pataProductionBill + attendanceBill
    };
};

export const getPataStockSummary = (masterData) => {
    const summary = {};

    masterData.pataEntries?.filter(e => e.status === 'Received').forEach(e => {
        const key = `${e.design}-${e.color}-${e.pataType}`;
        if (!summary[key]) {
            summary[key] = { design: e.design, color: e.color, type: e.pataType, added: 0, spent: 0 };
        }
        summary[key].added += Number(e.pataQty || 0);
    });

    masterData.productions?.filter(p => p.type === 'stone').forEach(p => {
        const key = `${p.design}-${p.color}-${p.pataType || 'Standard'}`;
        if (!summary[key]) {
            summary[key] = { design: p.design, color: p.color, type: p.pataType || 'Standard', added: 0, spent: 0 };
        }
        summary[key].spent += Number(p.pataQty || 0);
    });

    return Object.values(summary).map(item => ({
        ...item,
        balance: item.added - item.spent
    }));
};

export const getPataStockItem = (masterData, design, color, pataType) => {
    // 1. IN: Received from Pata Factory
    const added = (masterData.pataEntries || [])
        .filter(e => e.design === design && e.color === color && e.pataType === pataType && e.status === 'Received')
        .reduce((sum, e) => sum + Number(e.pataQty || 0), 0);

    // 2. OUT: Issued to Stone Workers (tracked via Productions pataQty)
    const spent = (masterData.productions || [])
        .filter(p => p.type === 'stone' && p.design === design && p.color === color && p.pataType === pataType)
        .reduce((sum, p) => sum + Number(p.pataQty || 0), 0);

    return added - spent;
};
