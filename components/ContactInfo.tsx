import styles from "./ContactInfo.module.css";

export default function ContactInfo() {
  return (
    <p className={styles.contact}>
      Questions or feedback? <a href="mailto:jolinma81@gmail.com">Get in touch</a>
    </p>
  );
}
