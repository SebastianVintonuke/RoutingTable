import IpDirection from '../IpDirection/IpDirection';

type OptimizationResultLog = {
    type: 'consecutives' | 'redundant' | 'contained',
    affectedEntries: Array<RoutingTableEntry>,
    resultEntry: RoutingTableEntry
}

export type OptimizacionResult = {
    result: Array<RoutingTableEntry>,
    optimization: OptimizationResultLog
}

export type RoutingTableEntry = {
    destinationIp: IpDirection,
    subnetMask: IpDirection,
    outputInterface: number,
    nextHop: IpDirection
}

export default class RoutingTable {
    static errorNoRouteToDestinationIp = 'No route to destination IP and no default gateway configured.';
    static errorAlreadyExists = 'An interface already exists for the given destination IP and subnet mask, with a different next hop.';
    static errorInvalidOutputInterfaceNextHop = 'An interface already exists with a different next hop.';
    static errorInvalidOutputInterface = 'Output interface must be a non-negative integer.';

    private entries: Array<RoutingTableEntry> = [];

    public nextHopInterface(ipDirection: IpDirection): number {
        const matches = new Array<{ entry: RoutingTableEntry, subnetMaskLength: number }>();

        this.entries.forEach(entry => {
            const subnetMaskLength = entry.destinationIp.with_matches(ipDirection, entry.subnetMask);
            if (subnetMaskLength === -1) return;
            matches.push({ entry, subnetMaskLength });
        });

        if (matches.length === 0) throw new Error(RoutingTable.errorNoRouteToDestinationIp);

        matches.sort((a, b) => b.subnetMaskLength - a.subnetMaskLength);

        return matches[0].entry.outputInterface;
    }

    public setAnInterface(destinationIp: IpDirection, subnetMask: IpDirection, outputInterface: number, nextHop: IpDirection): void {
        const newEntry: RoutingTableEntry = {
            destinationIp: destinationIp,
            subnetMask: subnetMask,
            outputInterface: outputInterface,
            nextHop: nextHop
        };

        this.isValidOrThrowError(newEntry);

        this.entries.push(newEntry);
    }

    private isValidOrThrowError(newEntry: RoutingTableEntry): void {
        if (newEntry.outputInterface < 0) throw new Error(RoutingTable.errorInvalidOutputInterface);

        const alreadyExists = this.entries.some(entry => 
            entry.destinationIp.equals(newEntry.destinationIp) &&
            entry.subnetMask.equals(newEntry.subnetMask) &&
            (
                entry.outputInterface !== newEntry.outputInterface ||
                !entry.nextHop.equals(newEntry.nextHop)
            )
        );

        if (alreadyExists) throw new Error(RoutingTable.errorAlreadyExists);

        const isInvalidOuputInterfaceNextHop = this.entries.some(entry =>
            newEntry.outputInterface === entry.outputInterface && !newEntry.nextHop.equals(entry.nextHop) ||
            newEntry.outputInterface !== entry.outputInterface && newEntry.nextHop.equals(entry.nextHop)
        );

        if (isInvalidOuputInterfaceNextHop) throw new Error(RoutingTable.errorInvalidOutputInterfaceNextHop);
    }

    public optimize(): Array<OptimizacionResult> {
        const currentEntries = [...this.entries];
        const optimizations: Array<OptimizacionResult> = [];

        let changed = true;

        while (changed) {
            changed = false;

            if (this.applyRedundantOptimization(currentEntries, optimizations)) {
                changed = true;
                continue;
            }

            if (this.applyContiguousOptimization(currentEntries, optimizations)) {
                changed = true;
            }
        }

        return optimizations;
    }

    private applyRedundantOptimization(currentEntries: Array<RoutingTableEntry>, optimizations: Array<OptimizacionResult>): boolean {
        for (let i = 0; i < currentEntries.length; i++) {
            for (let j = i + 1; j < currentEntries.length; j++) {
                const entryA = currentEntries[i];
                const entryB = currentEntries[j];

                const optimization = this.tryOptimizeRedundant(entryA, entryB);
                if (optimization) {
                    currentEntries.splice(j, 1);
                    currentEntries.splice(i, 1);
                    currentEntries.push(optimization.resultEntry);

                    optimizations.push({
                        result: [...currentEntries],
                        optimization
                    });

                    return true;
                }
            }
        }
        return false;
    }

    private tryOptimizeRedundant(entry: RoutingTableEntry, otherEntry: RoutingTableEntry): OptimizationResultLog | null {
        if (entry.outputInterface === otherEntry.outputInterface) {
            if (entry.subnetMask.equals(otherEntry.subnetMask) && entry.destinationIp.equals(otherEntry.destinationIp)) {
                return {
                    type: 'redundant',
                    affectedEntries: [entry, otherEntry],
                    resultEntry: {
                        destinationIp: entry.destinationIp,
                        subnetMask: entry.subnetMask,
                        outputInterface: entry.outputInterface,
                        nextHop: entry.nextHop
                    }
                }
            }
        }
        return null;
    }

    private applyContiguousOptimization(currentEntries: Array<RoutingTableEntry>, optimizations: Array<OptimizacionResult>): boolean {
        for (let i = 0; i < currentEntries.length; i++) {
            for (let j = i + 1; j < currentEntries.length; j++) {
                const entryA = currentEntries[i];
                const entryB = currentEntries[j];

                const optimization = this.tryOptimizeContiguous(entryA, entryB);
                if (optimization) {
                    currentEntries.splice(j, 1);
                    currentEntries.splice(i, 1);
                    currentEntries.push(optimization.resultEntry);

                    optimizations.push({
                        result: [...currentEntries],
                        optimization
                    });

                    return true;
                }
            }
        }
        return false;
    }

    private tryOptimizeContiguous(entry: RoutingTableEntry, otherEntry: RoutingTableEntry): OptimizationResultLog | null {
        if (entry.outputInterface === otherEntry.outputInterface) {
            if (entry.subnetMask.equals(otherEntry.subnetMask)) {
                if (entry.destinationIp.differsInTheLastBit(otherEntry.destinationIp, otherEntry.subnetMask)) {
                    return {
                        type: 'consecutives',
                        affectedEntries: [entry, otherEntry],
                        resultEntry: {
                            destinationIp: entry.destinationIp.min(otherEntry.destinationIp),
                            subnetMask: entry.subnetMask.minus(1),
                            outputInterface: entry.outputInterface,
                            nextHop: entry.nextHop
                        }
                    }
                }
            }
        }
        return null;
    }
}