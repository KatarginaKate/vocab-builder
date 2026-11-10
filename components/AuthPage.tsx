import Image from "next/image";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import styles from "./AuthPage.module.css";

type AuthPageProps = {
  mode: "register" | "login";
};

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="VocabBuilder home">
            <span className={styles.brandMark} aria-hidden="true">
              <i /><i /><i /><i />
            </span>
            <span>VocabBuilder</span>
          </Link>
        </header>

        <section className={styles.content} aria-labelledby="auth-title">
          <div className={styles.formColumn}>
            <div className={`${styles.formCard} ${!isRegister ? styles.loginCard : ""}`}>
              <h1 id="auth-title">{isRegister ? "Register" : "Login"}</h1>
              <p className={styles.intro}>
                {isRegister
                  ? "To start using our services, please fill out the registration form below. All fields are mandatory:"
                  : "Please enter your login details to continue using our service:"}
              </p>
              <AuthForm mode={mode} />
              <p className={styles.switchPrompt}>
                {isRegister ? "Already have an account?" : "Do not have an account?"}{" "}
                <Link href={isRegister ? "/login" : "/register"}>
                  {isRegister ? "Login" : "Register"}
                </Link>
              </p>
            </div>
          </div>

          <div className={styles.illustration}>
            <div className={styles.imageCrop}>
              <Image
                className={styles.image}
                src="/foto-main.webp"
                alt="Two students studying English words together"
                width={512}
                height={512}
                priority
                sizes="(max-width: 767px) 90vw, 48vw"
              />
            </div>
            <p className={styles.illustrationText}>
              Word <span>·</span> Translation <span>·</span> Grammar <span>·</span> Progress
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
