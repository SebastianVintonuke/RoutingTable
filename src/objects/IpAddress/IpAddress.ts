export default class IpAddress {
    static fromString(aString: string): IpAddress {
        if (aString.trim().toLowerCase() === 'on-link') {
            return new IpAddressOnLink();
        }

        const octets = aString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(octet => isNaN(octet) || octet < 0 || octet > 255)) {
            throw new Error('Invalid IP address format.');
        }
        return new IpAddress(octets[0], octets[1], octets[2], octets[3]);
    }

    private static fromNumber(num: number): IpAddress {
        const first = (num >>> 24) & 0xFF;
        const second = (num >>> 16) & 0xFF;
        const third = (num >>> 8) & 0xFF;
        const fourth = num & 0xFF;
        return new IpAddress(first, second, third, fourth);
    }

    private static subnetMaskFromLength(length: number): IpAddress {
        if (length < 0 || length > 32) {
            throw new Error('Invalid prefix length');
        }
        const mask = length === 0 ? 0 : 0xFFFFFFFF << (32 - length);
        return IpAddress.fromNumber(mask >>> 0);
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

    public equals(other: IpAddress): boolean {
        return this.firstOctet === other.firstOctet &&
                this.secondOctet === other.secondOctet &&
                this.ThirdOctet === other.ThirdOctet &&
                this.fourthOctet === other.fourthOctet;
    }

    public with_matches(ipIpAddress: IpAddress, subnetMask: IpAddress): number | -1 {
        const matchLenght = this.matchLenght(ipIpAddress);
        const subnetMaskLength = subnetMask.maskLenght();

        return (matchLenght < subnetMaskLength) ? -1 : subnetMaskLength;
    }

    public differsInTheLastBit(ipIpAddress: IpAddress, subnetMask: IpAddress): boolean {
        const subnetMaskLength = subnetMask.maskLenght();
        return this.matchLenght(ipIpAddress) === subnetMaskLength - 1;
    }

    public min(other: IpAddress): IpAddress {
        const thisAsNumber = this.toNumber();
        const otherNumber = other.toNumber();
        return IpAddress.fromNumber((thisAsNumber <= otherNumber) ? thisAsNumber : otherNumber);
    }

    public minus(n: number): IpAddress {
        const subnetMaskLength = this.maskLenght();;
        const newSubnetMask = subnetMaskLength - n;
        return (newSubnetMask < 0) ? IpAddress.subnetMaskFromLength(0) : IpAddress.subnetMaskFromLength(newSubnetMask);
    }

    public toString(): string {
        return `${this.firstOctet}.${this.secondOctet}.${this.ThirdOctet}.${this.fourthOctet}`;
    }

    public maskLenght(): number {
        return this.matchLenght(IpAddress.fromString('255.255.255.255'));
    }

    public toBinaryString(): string {
        return this.octetToBinaryString(this.firstOctet) +
                this.octetToBinaryString(this.secondOctet) + 
                this.octetToBinaryString(this.ThirdOctet) +
                this.octetToBinaryString(this.fourthOctet);
    }

    public isLessSpecificThan(otherSubnetMask: IpAddress): boolean {
        return this.maskLenght() < otherSubnetMask.maskLenght();
    }

    public isMoreSpecificThan(otherSubnetMask: IpAddress): boolean {
        return this.maskLenght() > otherSubnetMask.maskLenght();
    }

    public isContainedBy(subnetMask: IpAddress, other: IpAddress, otherSubnetMask: IpAddress): boolean {
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

    public lastIpDefinedBy(subnetMask: IpAddress): IpAddress {
        const base = this.toNumber() >>> 0;
        const mask = subnetMask.toNumber() >>> 0;
        const broadcast = base | (~mask >>> 0);
        return IpAddress.fromNumber(broadcast >>> 0);
    }

    private octetToBinaryString(n: number): string {
        return n.toString(2).padStart(8, '0');
    }

    private matchLenght(other: IpAddress): number {
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

class IpAddressOnLink extends IpAddress {
    static errorInvalidOperationForOnLinkIp = 'Operation not valid on "On-link"';

    static fromString(aString: string): IpAddress {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    constructor() {
        super(0, 0, 0, 0);
    }

    public equals(other: IpAddress): boolean {
        return other instanceof IpAddressOnLink;
    }

    public with_matches(ipIpAddress: IpAddress, subnetMask: IpAddress): number | -1 {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public differsInTheLastBit(ipIpAddress: IpAddress, subnetMask: IpAddress): boolean {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public min(other: IpAddress): IpAddress {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public minus(n: number): IpAddress {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public toString(): string {
        return 'On-link';
    }

    public maskLenght(): number {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public toBinaryString(): string {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isLessSpecificThan(otherSubnetMask: IpAddress): boolean {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isMoreSpecificThan(otherSubnetMask: IpAddress): boolean {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public isContainedBy(subnetMask: IpAddress, other: IpAddress, otherSubnetMask: IpAddress): boolean {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }

    public lastIpDefinedBy(subnetMask: IpAddress): IpAddress {
        throw new Error(IpAddressOnLink.errorInvalidOperationForOnLinkIp);
    }
}