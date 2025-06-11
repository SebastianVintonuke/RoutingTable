export default class IpDirection {
    static fromString(aString: string): IpDirection {
        if (aString.trim().toLowerCase() === 'on-link') {
            return new IpDirectionOnLink();
        }

        const octets = aString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(octet => isNaN(octet) || octet < 0 || octet > 255)) {
            throw new Error('Invalid IP address format.');
        }
        return new IpDirection(octets[0], octets[1], octets[2], octets[3]);
    }

    private static fromNumber(num: number): IpDirection {
        const first = (num >>> 24) & 0xFF;
        const second = (num >>> 16) & 0xFF;
        const third = (num >>> 8) & 0xFF;
        const fourth = num & 0xFF;
        return new IpDirection(first, second, third, fourth);
    }

    private static subnetMaskFromLength(length: number): IpDirection {
        if (length < 0 || length > 32) {
            throw new Error('Invalid prefix length');
        }
        const mask = length === 0 ? 0 : 0xFFFFFFFF << (32 - length);
        return IpDirection.fromNumber(mask >>> 0);
    }

    private firstOctet: number;
    private secondOctet: number;
    private ThirdOctet: number;
    private fourthOctet: number;

    protected constructor(firstOctet: number, secondOctet: number, thirdOctet: number, fourthOctet: number) {
        this.firstOctet = firstOctet;
        this.secondOctet = secondOctet;
        this.ThirdOctet = thirdOctet;
        this.fourthOctet = fourthOctet;
    }

    public equals(other: IpDirection): boolean {
        return this.firstOctet === other.firstOctet &&
                this.secondOctet === other.secondOctet &&
                this.ThirdOctet === other.ThirdOctet &&
                this.fourthOctet === other.fourthOctet;
    }

    public with_matches(ipDirection: IpDirection, subnetMask: IpDirection): number | -1 {
        const matchLenght = this.matchLenght(ipDirection);
        const subnetMaskLength = subnetMask.maskLenght();

        return (matchLenght < subnetMaskLength) ? -1 : subnetMaskLength;
    }

    public differsInTheLastBit(ipDirection: IpDirection, subnetMask: IpDirection): boolean {
        const subnetMaskLength = subnetMask.maskLenght();
        return this.matchLenght(ipDirection) === subnetMaskLength - 1;
    }

    public min(other: IpDirection): IpDirection {
        const thisAsNumber = this.toNumber();
        const otherNumber = other.toNumber();
        return IpDirection.fromNumber((thisAsNumber <= otherNumber) ? thisAsNumber : otherNumber);
    }

    public minus(n: number): IpDirection {
        const subnetMaskLength = this.maskLenght();;
        const newSubnetMask = subnetMaskLength - n;
        return (newSubnetMask < 0) ? IpDirection.subnetMaskFromLength(0) : IpDirection.subnetMaskFromLength(newSubnetMask);
    }

    public toString(): string {
        return `${this.firstOctet}.${this.secondOctet}.${this.ThirdOctet}.${this.fourthOctet}`;
    }

    public maskLenght(): number {
        return this.matchLenght(IpDirection.fromString('255.255.255.255'));
    }

    public toBinaryString(): string {
        return this.octetToBinaryString(this.firstOctet) +
                this.octetToBinaryString(this.secondOctet) + 
                this.octetToBinaryString(this.ThirdOctet) +
                this.octetToBinaryString(this.fourthOctet);
    }

    public isLessSpecificThan(otherSubnetMask: IpDirection): boolean {
        return this.maskLenght() < otherSubnetMask.maskLenght();
    }

    public isMoreSpecificThan(otherSubnetMask: IpDirection): boolean {
        return this.maskLenght() > otherSubnetMask.maskLenght();
    }

    public isContainedBy(subnetMask: IpDirection, other: IpDirection, otherSubnetMask: IpDirection): boolean {
        const base = this.toNumber() >>> 0;
        const mask = subnetMask.toNumber() >>> 0;
        const otherBase = other.toNumber() >>> 0;
        const otherMask = otherSubnetMask.toNumber() >>> 0;

        const min = base & mask;
        const max = base | (~mask >>> 0);

        const otherMin = otherBase & otherMask;
        const otherMax = otherBase | (~otherMask >>> 0);

        return (min >>> 0) >= (otherMin >>> 0) && (max >>> 0) <= (otherMax >>> 0);
    }

    public lastIpDefinedBy(subnetMask: IpDirection): IpDirection {
        const base = this.toNumber() >>> 0;
        const mask = subnetMask.toNumber() >>> 0;
        const broadcast = base | (~mask >>> 0);
        return IpDirection.fromNumber(broadcast >>> 0);
    }

    private octetToBinaryString(n: number): string {
        return n.toString(2).padStart(8, '0');
    }

    private matchLenght(other: IpDirection): number {
        for (let i = 0; i < 32; i++) {
            if (this.toBinaryString()[i] !== other.toBinaryString()[i]) return i;
        }
        return 32;
    }

    private toNumber(): number {
        return (this.firstOctet << 24) |
            (this.secondOctet << 16) |
            (this.ThirdOctet << 8) |
            this.fourthOctet;
    }
}

class IpDirectionOnLink extends IpDirection {
    static errorInvalidOperationForOnLinkIp = 'Operation not valid on "On-link"';

    static fromString(aString: string): IpDirection {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    constructor() {
        super(0, 0, 0, 0);
    }

    public equals(other: IpDirection): boolean {
        return other instanceof IpDirectionOnLink;
    }

    public with_matches(ipDirection: IpDirection, subnetMask: IpDirection): number | -1 {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public differsInTheLastBit(ipDirection: IpDirection, subnetMask: IpDirection): boolean {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public min(other: IpDirection): IpDirection {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public minus(n: number): IpDirection {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public toString(): string {
        return 'On-link';
    }

    public maskLenght(): number {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public toBinaryString(): string {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isLessSpecificThan(otherSubnetMask: IpDirection): boolean {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isMoreSpecificThan(otherSubnetMask: IpDirection): boolean {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isContainedBy(subnetMask: IpDirection, other: IpDirection, otherSubnetMask: IpDirection): boolean {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }

    public lastIpDefinedBy(subnetMask: IpDirection): IpDirection {
        throw new Error(IpDirectionOnLink.errorInvalidOperationForOnLinkIp);
    }
}