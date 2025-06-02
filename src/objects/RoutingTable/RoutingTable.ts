import IpDirection from '../IpDirection/IpDirection';

type OptimizationResultLog = {
    type: 'consecutives' | 'redundant' | 'contained',
    affectedEntries: Array<RoutingTableEntry>,
    resultEntry: RoutingTableEntry,
    consecutivesExtraInfo?: {
        binaryDestinationIp1: string,
        binaryDestinationIp2: string,
        subnetMaskLength: number
    },
    containedExtraInfo?: {
        outerEntryStart: string,
        outerEntryEnd: string,
        innerEntryStart: string,
        innerEntryEnd: string,
    }
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
                continue;
            }

            if (this.applyContainedOptimization(currentEntries, optimizations)) {
                changed = true;
                continue;
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
                        },
                        consecutivesExtraInfo: {
                            binaryDestinationIp1: entry.destinationIp.toBinaryString(),
                            binaryDestinationIp2: otherEntry.destinationIp.toBinaryString(),
                            subnetMaskLength: entry.subnetMask.maskLenght()
                        }
                    }
                }
            }
        }
        return null;
    }

    private applyContainedOptimization(currentEntries: Array<RoutingTableEntry>, optimizations: Array<OptimizacionResult>): boolean {
        for (let i = 0; i < currentEntries.length; i++) {
            for (let j = 0; j < currentEntries.length; j++) {
                if (i === j) continue;

                const A = currentEntries[i];
                const B = currentEntries[j];

                const optimization = this.tryOptimizeContained(A, B, currentEntries);
                if (optimization) {
                    currentEntries.splice(j, 1);

                    optimizations.push({
                        result: [...currentEntries],
                        optimization
                    });

                    return true;
                }

                const reverseOptimization = this.tryOptimizeContained(B, A, currentEntries);
                if (reverseOptimization) {
                    currentEntries.splice(i, 1);

                    optimizations.push({
                        result: [...currentEntries],
                        optimization: reverseOptimization
                    });

                    return true;
                }
            }
        }
        return false;
    }


    private tryOptimizeContained(outer: RoutingTableEntry, inner: RoutingTableEntry, allEntries: Array<RoutingTableEntry>): OptimizationResultLog | null {
        if (outer.outputInterface === inner.outputInterface) {
            if (outer.subnetMask.isLessSpecificThan(inner.subnetMask) && inner.destinationIp.isContainedBy(inner.subnetMask, outer.destinationIp, outer.subnetMask)) {
                for (const third of allEntries) {
                    if (third === outer || third === inner) continue;

                    const isMoreSpecific = inner.subnetMask.isMoreSpecificThan(third.subnetMask);
                    const isContained = inner.destinationIp.isContainedBy(inner.subnetMask, third.destinationIp, third.subnetMask);
                    const conflicts = third.outputInterface !== inner.outputInterface;

                    if (isMoreSpecific && isContained && conflicts) return null;
                }

                return {
                    type: 'contained',
                    affectedEntries: [inner],
                    resultEntry: outer,
                    containedExtraInfo: {
                        outerEntryStart: outer.destinationIp.toString(),
                        outerEntryEnd: outer.destinationIp.lastIpDefinedBy(outer.subnetMask).toString(),
                        innerEntryStart: inner.destinationIp.toString(),
                        innerEntryEnd: inner.destinationIp.lastIpDefinedBy(inner.subnetMask).toString()
                    }
                };
            }
        }
        return null;
    }
}