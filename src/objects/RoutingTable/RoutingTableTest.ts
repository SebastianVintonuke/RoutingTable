import TestCase from '../TestCase/TestCase';
import RoutingTable from './RoutingTable';
import IpDirection from '../IpDirection/IpDirection';

export default class RoutingTableTestCaseTest extends TestCase {
    setDefaultGatewayTo(routingTable: RoutingTable, outputInterface: number, nextHop: IpDirection) {
        routingTable.setAnInterface(IpDirection.fromString('0.0.0.0'), IpDirection.fromString('0.0.0.0'), outputInterface, nextHop);
    }

    test01ANewRoutingTableDoesNotRedirectAnywhere() {
        const aRoutingTable = new RoutingTable();
        const anIpDirection = IpDirection.fromString('127.0.0.1');

        this.shouldRaise(()=>{ aRoutingTable.nextHopInterface(anIpDirection) }, RoutingTable.errorNoRouteToDestinationIp);
    }

    test02AnIpAddressFullMatchesAnInterface() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpDirection.fromString('127.0.0.1');
        const aSubnetMask = IpDirection.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpDirection.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.assertEquals(aRoutingTable.nextHopInterface(aDestinationIp), anInterface);
    }

    test03ARoutingTableCanNotSetTheSameIpMaskToADifferentInterfaceNextHop() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpDirection.fromString('127.0.0.1');
        const aSubnetMask = IpDirection.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpDirection.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.shouldRaise(() => {
            const anOtherInterface = 2;
            aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anOtherInterface, aNextHop);
        }, RoutingTable.errorAlreadyExists);

        this.shouldRaise(() => {
            const anOtherNextHop = IpDirection.fromString('2.2.2.2')
            aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, anOtherNextHop);
        }, RoutingTable.errorAlreadyExists);
    }

    test04ARoutingTableCanNotSetANewNextHopForAnExistingInterface() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpDirection.fromString('127.0.0.1');
        const aSubnetMask = IpDirection.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpDirection.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        const anOtherDestinationIp = IpDirection.fromString('127.0.0.2');

        this.shouldRaise(() => {
            const anOtherInterface = 2;
            aRoutingTable.setAnInterface(anOtherDestinationIp, aSubnetMask, anOtherInterface, aNextHop);
        }, RoutingTable.errorInvalidOutputInterfaceNextHop);

        this.shouldRaise(() => {
            const anOtherNextHop = IpDirection.fromString('2.2.2.2');
            aRoutingTable.setAnInterface(anOtherDestinationIp, aSubnetMask, anInterface, anOtherNextHop);
        }, RoutingTable.errorInvalidOutputInterfaceNextHop);
    }

    test05AnIpAddressFullMatchesWithADefaultGateway() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        const aDestinationIp = IpDirection.fromString('127.0.0.1');
        const aSubnetMask = IpDirection.fromString('255.255.255.255');
        const anInterface = 2;
        const aNextHop = IpDirection.fromString('2.2.2.2');
        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.assertEquals(aRoutingTable.nextHopInterface(aDestinationIp), anInterface);
    }

    test06UsesDefaultGatewayWhenNoOtherMatches() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.1')), 1);
    }

    test07UsesMoreSpecificRouteOverDefaultGateway() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.1'),
            IpDirection.fromString('255.255.255.255'),
            2,
            IpDirection.fromString('2.2.2.2'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.1')), 2);
    }

    test08FallsBackToDefaultIfNoSpecificRouteMatches() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.1'),
            IpDirection.fromString('255.255.255.255'),
            2,
            IpDirection.fromString('2.2.2.2'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.2')), 1);
    }

    test09PicksMidSpecificityOverDefault() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.0.0.0'),
            3,
            IpDirection.fromString('3.3.3.3'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.2')), 3);
    }

    test10FallsBackToDefaultWhenNoMatch() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('10.0.0.1')), 1);
    }

    test11PicksBestAmongMultipleMatchingPrefixes() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.0.0.0'),
            3,
            IpDirection.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.255.0.0'),
            4,
            IpDirection.fromString('4.4.4.4'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.5')), 4);
    }

    test12ExactMatchOverridesAll() {
        const aRoutingTable = new RoutingTable();

        this.setDefaultGatewayTo(aRoutingTable, 1, IpDirection.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.0.0.0'),
            3,
            IpDirection.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.255.0.0'),
            4,
            IpDirection.fromString('4.4.4.4'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.5'),
            IpDirection.fromString('255.255.255.255'),
            5,
            IpDirection.fromString('5.5.5.5'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.0.5')), 5);
    }

    test13ChoosesLongestPrefixAmongMultipleMatches() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.0.0.0'),
            3,
            IpDirection.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpDirection.fromString('127.0.0.0'),
            IpDirection.fromString('255.255.0.0'),
            4,
            IpDirection.fromString('4.4.4.4'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpDirection.fromString('127.0.1.10')), 4);
    }

    // Ejemplo agregación de prefijos
    test14OptimizationContiguous() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpDirection.fromString('192.168.0.0'),
            IpDirection.fromString('255.255.255.0'),
            1,
            IpDirection.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpDirection.fromString('192.168.1.0'),
            IpDirection.fromString('255.255.255.0'),
            1,
            IpDirection.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assert(result);
    }
}