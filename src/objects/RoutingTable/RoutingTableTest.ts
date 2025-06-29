import TestCase from '../TestCase/TestCase';
import RoutingTable from './RoutingTable';
import IpAddress from '../IpAddress/IpAddress';

export default class RoutingTableTestCaseTest extends TestCase {
    setDefaultGatewayTo(routingTable: RoutingTable, outputInterface: number, nextHop: IpAddress) {
        routingTable.setAnInterface(IpAddress.fromString('0.0.0.0'), IpAddress.fromString('0.0.0.0'), outputInterface, nextHop);
    }

    test01ANewRoutingTableDoesNotRedirectAnywhere() {
        const aRoutingTable = new RoutingTable();
        const anIpAddress = IpAddress.fromString('127.0.0.1');

        this.shouldRaise(()=>{ aRoutingTable.nextHopInterface(anIpAddress) }, RoutingTable.errorNoRouteToDestinationIp);
    }

    test02AnIpAddressFullMatchesAnInterface() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpAddress.fromString('127.0.0.1');
        const aSubnetMask = IpAddress.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpAddress.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.assertEquals(aRoutingTable.nextHopInterface(aDestinationIp), anInterface);
    }

    test03ARoutingTableCanNotSetTheSameIpMaskToADifferentInterfaceNextHop() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpAddress.fromString('127.0.0.1');
        const aSubnetMask = IpAddress.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpAddress.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.shouldRaise(() => {
            const anOtherInterface = 2;
            aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anOtherInterface, aNextHop);
        }, RoutingTable.errorAlreadyExists);

        this.shouldRaise(() => {
            const anOtherNextHop = IpAddress.fromString('2.2.2.2')
            aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, anOtherNextHop);
        }, RoutingTable.errorAlreadyExists);
    }

    test04ARoutingTableCanNotSetANewNextHopForAnExistingInterface() {
        const aRoutingTable = new RoutingTable();

        const aDestinationIp = IpAddress.fromString('127.0.0.1');
        const aSubnetMask = IpAddress.fromString('255.255.255.255');
        const anInterface = 1;
        const aNextHop = IpAddress.fromString('1.1.1.1');

        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        const anOtherDestinationIp = IpAddress.fromString('127.0.0.2');

        this.shouldRaise(() => {
            const anOtherInterface = 2;
            aRoutingTable.setAnInterface(anOtherDestinationIp, aSubnetMask, anOtherInterface, aNextHop);
        }, RoutingTable.errorInvalidOutputInterfaceNextHop);

        this.shouldRaise(() => {
            const anOtherNextHop = IpAddress.fromString('2.2.2.2');
            aRoutingTable.setAnInterface(anOtherDestinationIp, aSubnetMask, anInterface, anOtherNextHop);
        }, RoutingTable.errorInvalidOutputInterfaceNextHop);
    }

    test05AnIpAddressFullMatchesWithADefaultGateway() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        const aDestinationIp = IpAddress.fromString('127.0.0.1');
        const aSubnetMask = IpAddress.fromString('255.255.255.255');
        const anInterface = 2;
        const aNextHop = IpAddress.fromString('2.2.2.2');
        aRoutingTable.setAnInterface(aDestinationIp, aSubnetMask, anInterface, aNextHop);

        this.assertEquals(aRoutingTable.nextHopInterface(aDestinationIp), anInterface);
    }

    test06UsesDefaultGatewayWhenNoOtherMatches() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.1')), 1);
    }

    test07UsesMoreSpecificRouteOverDefaultGateway() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.1'),
            IpAddress.fromString('255.255.255.255'),
            2,
            IpAddress.fromString('2.2.2.2'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.1')), 2);
    }

    test08FallsBackToDefaultIfNoSpecificRouteMatches() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.1'),
            IpAddress.fromString('255.255.255.255'),
            2,
            IpAddress.fromString('2.2.2.2'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.2')), 1);
    }

    test09PicksMidSpecificityOverDefault() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            3,
            IpAddress.fromString('3.3.3.3'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.2')), 3);
    }

    test10FallsBackToDefaultWhenNoMatch() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('10.0.0.1')), 1);
    }

    test11PicksBestAmongMultipleMatchingPrefixes() {
        const aRoutingTable = new RoutingTable();
        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            3,
            IpAddress.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.255.0.0'),
            4,
            IpAddress.fromString('4.4.4.4'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.5')), 4);
    }

    test12ExactMatchOverridesAll() {
        const aRoutingTable = new RoutingTable();

        this.setDefaultGatewayTo(aRoutingTable, 1, IpAddress.fromString('1.1.1.1'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            3,
            IpAddress.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.255.0.0'),
            4,
            IpAddress.fromString('4.4.4.4'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.5'),
            IpAddress.fromString('255.255.255.255'),
            5,
            IpAddress.fromString('5.5.5.5'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.0.5')), 5);
    }

    test13ChoosesLongestPrefixAmongMultipleMatches() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            3,
            IpAddress.fromString('3.3.3.3'));

        aRoutingTable.setAnInterface(IpAddress.fromString('127.0.0.0'),
            IpAddress.fromString('255.255.0.0'),
            4,
            IpAddress.fromString('4.4.4.4'));

        this.assertEquals(aRoutingTable.nextHopInterface(IpAddress.fromString('127.0.1.10')), 4);
    }

    // Optimization

    test14OptimizationContiguous() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.1.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].optimization.type, 'consecutives');

        this.assert(result[0].optimization.resultEntry.destinationIp.equals(IpAddress.fromString('192.168.0.0')));
        this.assert(result[0].optimization.resultEntry.subnetMask.equals(IpAddress.fromString('255.255.254.0')));
        this.assertEquals(result[0].optimization.resultEntry.outputInterface, 1);
        this.assert(result[0].optimization.resultEntry.nextHop.equals(IpAddress.fromString('1.1.1.1')));
    }

    test15OptimizationRedundant() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('0.0.0.0'),
            IpAddress.fromString('0.0.0.0'),
            0,
            IpAddress.fromString('0.0.0.0')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('0.0.0.0'),
            IpAddress.fromString('0.0.0.0'),
            0,
            IpAddress.fromString('0.0.0.0')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].optimization.type, 'redundant');

        this.assert(result[0].optimization.resultEntry.destinationIp.equals(IpAddress.fromString('0.0.0.0')));
        this.assert(result[0].optimization.resultEntry.subnetMask.equals(IpAddress.fromString('0.0.0.0')));
        this.assertEquals(result[0].optimization.resultEntry.outputInterface, 0);
        this.assert(result[0].optimization.resultEntry.nextHop.equals(IpAddress.fromString('0.0.0.0')));
    }

    test16OptimizationRedundantIsSolvedBeforeOptimizationContiguous() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.1.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('0.0.0.0'),
            IpAddress.fromString('0.0.0.0'),
            0,
            IpAddress.fromString('0.0.0.0')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('0.0.0.0'),
            IpAddress.fromString('0.0.0.0'),
            0,
            IpAddress.fromString('0.0.0.0')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 2);
        this.assertEquals(result[0].optimization.type, 'redundant');
        this.assertEquals(result[1].optimization.type, 'consecutives');
    }

    test17OptimizationContiguousNested() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.1.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.2.0'),
            IpAddress.fromString('255.255.254.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 2);
        this.assertEquals(result[0].optimization.type, 'consecutives');
        this.assertEquals(result[1].optimization.type, 'consecutives');
    }

    test18OptimizationContained() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].optimization.type, 'contained');
        this.assertEquals(result[0].optimization.affectedEntries[0].destinationIp.toString(), '192.168.0.0')
        this.assertEquals(result[0].optimization.resultEntry.destinationIp.toString(), '192.0.0.0')
    }

    test19OptimizationContainedWithOtherInTheMiddle() {
        const aRoutingTable = new RoutingTable();

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.0.0'),
            2,
            IpAddress.fromString('2.2.2.2')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 0);
    }

    test20OptimizationContainedWithDefaultGateway() {
        const aRoutingTable = new RoutingTable();

        this.setDefaultGatewayTo(aRoutingTable, 0, IpAddress.fromString('0.0.0.0'));

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.0.0.0'),
            IpAddress.fromString('255.0.0.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        aRoutingTable.setAnInterface(
            IpAddress.fromString('192.168.0.0'),
            IpAddress.fromString('255.255.255.0'),
            1,
            IpAddress.fromString('1.1.1.1')
        );

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].optimization.type, 'contained');
        this.assertEquals(result[0].optimization.affectedEntries[0].destinationIp.toString(), '192.168.0.0')
    }

    test21OptimizationContainedWithOtherInTheMiddleAndDefaultGateway() {
        const aRoutingTable = new RoutingTable();

        // 163.9.162.0 - 163.9.163.255 => 4
        aRoutingTable.setAnInterface(
            IpAddress.fromString('163.9.162.0'),
            IpAddress.fromString('255.255.254.0'),
            4,
            IpAddress.fromString('10.119.240.13')
        );

        // 163.9.160.0 - 163.9.175.255 => 1
        aRoutingTable.setAnInterface(
            IpAddress.fromString('163.9.160.0'),
            IpAddress.fromString('255.255.240.0'),
            1,
            IpAddress.fromString('163.9.163.69')
        );

        // 163.9.160.0 - 163.9.191.255 => 4
        aRoutingTable.setAnInterface(
            IpAddress.fromString('163.9.160.0'),
            IpAddress.fromString('255.255.224.0 '),
            4,
            IpAddress.fromString('10.119.240.13')
        );

        // 0.0.0.0 - 255.255.255.255 => 4
        this.setDefaultGatewayTo(aRoutingTable, 4, IpAddress.fromString('10.119.240.13'));

        const result = aRoutingTable.optimize();

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].optimization.type, 'contained');
        this.assertEquals(result[0].optimization.affectedEntries[0].destinationIp.toString(), '163.9.160.0')
    }
}