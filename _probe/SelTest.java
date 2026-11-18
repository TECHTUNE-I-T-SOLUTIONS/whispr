import java.nio.channels.Selector;

public class SelTest {
    public static void main(String[] a) {
        System.out.println("java.io.tmpdir            = " + System.getProperty("java.io.tmpdir"));
        System.out.println("jdk.net.unixdomain.tmpdir = " + System.getProperty("jdk.net.unixdomain.tmpdir"));
        try {
            Selector s = Selector.open();
            System.out.println("Selector.open() -> OK");
            s.close();
        } catch (Throwable t) {
            System.out.println("Selector.open() -> FAILED: " + t);
        }
    }
}
