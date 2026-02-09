import User from "src/domain/entities/user-entity";
import { UserOrmEntity } from "../entities/user.orm-entity";
import { Wallet, WalletCurrency } from "src/domain/entities/user-wallet.entity";
import { WalletOrmEntity } from "../entities/wallet.orm-entity";
import { WalletTransactionOrmEntity } from "../entities/wallet-transaction.orm-entity";
import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";
import { UserProfile } from "src/domain/entities/user-profile.entity";
import { InstructorProfile } from "src/domain/entities/instructor-profile.entity";
import {
  SocialProvider,
  UserSocials,
} from "src/domain/entities/user-socials.entity";
import { InstructorProfileOrmEntity } from "../entities/instructor-profile.orm-entity";
import { UserProfileOrmEntity } from "../entities/user-profile-orm.entiry";
import { UserSocialOrmEntity } from "../entities/socials.orm-entity";
import { Cart } from "src/domain/entities/cart.entity";
import { CartOrmEntity } from "../entities/cart.orm-entity";
import { CartItemOrmEntity } from "../entities/cart-item.orm-entity";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import { WishlistOrmEntity } from "../entities/wishlist.orm-entity";
import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { WishlistItemOrmEntity } from "../entities/wishlist-item.orm-entity";
import { InstructorStudent, RelationshipStatus } from "src/domain/entities/instructor-student.entity";
import { InstructorStudentOrmEntity, RelationshipStatusOrm } from "../entities/instructor-student.orm-entity";

export class EntityMapper {


  // --- User Mapping ---
  static toDomainUser(user: UserOrmEntity): User {
    const domainUser = User.fromPrimitives({
      createdAt: user.createdAt,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt,
      slug: user.slug,
      avatar: user.avatarUrl,
      profile: user.profile
        ? UserProfile.fromPrimitives({
            id: user.profile.id,
            userId: user.profile.userId,
            bio: user.profile.bio,
            city: user.profile.city,
            country: user.profile.country,
            createdAt: user.profile.createdAt,
            gender: user.profile.gender,
            language: user.profile.language,
            phone: user.profile.phone,
            preferences: user.profile.preferences,
            website: user.profile.website,
          })
        : undefined,
      instructorProfile: user.instructorProfile
        ? InstructorProfile.fromPrimitives({
            id: user.instructorProfile.id,
            bio: user.instructorProfile.bio,
            joinedAt: user.instructorProfile.joinedAt,
            certificate: user.instructorProfile.certificate,
            experience: user.instructorProfile.experience,
            expertise: user.instructorProfile.expertise,
            headline: user.instructorProfile.headline,
            rating: user.instructorProfile.rating,
            tags: user.instructorProfile.tags,
            userId: user.instructorProfile.userId,
            totalCourses: user.instructorProfile.totalCourses,
            totalStudents: user.instructorProfile.totalStudents,
          })
        : undefined,
      socials: user.socials?.map((social) =>
        UserSocials.fromPrimitives({
          id: social.id,
          profileUrl: social.profileUrl,
          provider: social.provider as SocialProvider,
          userId: social.userId,
          providerUserId: social.providerUserId,
        })
      ),
      lastLoginAt: user.lastLoginAt,
    });

    return domainUser;
  }

  static toOrmUser(user: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.status = user.status;
    ormEntity.createdAt = user.createdAt;
    ormEntity.updatedAt = user.updatedAt;
    ormEntity.id = user.id;
    ormEntity.username = user.username;
    ormEntity.slug = user.slug;
    ormEntity.email = user.email;
    ormEntity.role = user.role;
    ormEntity.firstName = user.firstName;
    ormEntity.lastName = user.lastName;
    ormEntity.avatarUrl = user.avatar;
    ormEntity.lastLoginAt = user.lastLoginAt;

    // Only create instructor profile if it has meaningful data
    if (user.instructorProfile && user.instructorProfile.id) {
      const ormInstructorProfile = new InstructorProfileOrmEntity();
      const instructor = user.instructorProfile;
      ormInstructorProfile.id = instructor.id;
      ormInstructorProfile.userId = user.id;
      ormInstructorProfile.bio = instructor.bio;
      ormInstructorProfile.certificate = instructor.certificate;
      ormInstructorProfile.experience = instructor.experience;
      ormInstructorProfile.expertise = instructor.expertise;
      ormInstructorProfile.headline = instructor.headline;
      ormInstructorProfile.rating = instructor.rating;
      ormInstructorProfile.tags = instructor.tags.slice();
      ormInstructorProfile.totalCourses = instructor.totalCourses;
      ormInstructorProfile.totalStudents = instructor.totalStudents;
      ormEntity.instructorProfile = ormInstructorProfile;
    }

    // Only create user profile if it has meaningful data
    if (user.profile && user.profile.id) {
      const ormUserProfile = new UserProfileOrmEntity();
      const userProfile = user.profile;
      ormUserProfile.id = userProfile.id;
      ormUserProfile.userId = user.id;
      ormUserProfile.bio = userProfile.bio;
      ormUserProfile.language = userProfile.language;
      ormUserProfile.website = userProfile.website;
      ormUserProfile.city = userProfile.city;
      ormUserProfile.country = userProfile.country;
      ormUserProfile.gender = userProfile.gender;
      ormUserProfile.phone = userProfile.phone;
      ormUserProfile.preferences = userProfile.preferences;
      ormEntity.profile = ormUserProfile;
    }

    // Only create socials if they exist
    if (user.socials && user.socials.length > 0) {
      ormEntity.socials = user.socials.map((social) => {
        const socialEntity = new UserSocialOrmEntity();
        socialEntity.id = social.id;
        socialEntity.profileUrl = social.profileUrl;
        socialEntity.provider = social.provider;
        socialEntity.providerUserId = social.providerUserId;
        socialEntity.userId = user.id;
        return socialEntity;
      });
    }

    return ormEntity;
  }

  // --- Wallet Mapping ---
  static toDomainWallet(
    wallet: WalletOrmEntity,
    transactions: WalletTransactionOrmEntity[]
  ): Wallet {
    const txs = transactions.map(EntityMapper.toDomainWalletTransaction);
    return Wallet.fromPrimitives({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency as WalletCurrency,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      transactions: txs,
    });
  }

  static toOrmWallet(wallet: Wallet): WalletOrmEntity {
    const orm = new WalletOrmEntity();
    orm.id = wallet.id;
    orm.userId = wallet.userId;
    orm.balance = wallet.balance;
    orm.currency = wallet.currency;
    orm.createdAt = wallet.createdAt;
    orm.updatedAt = wallet.updatedAt;
    return orm;
  }

  static toDomainWalletTransaction(
    tx: WalletTransactionOrmEntity
  ): WalletTransaction {
    return WalletTransaction.fromPrimitives({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      timestamp: tx.timestamp,
      note: tx.note,
      relatedOrder: tx.relatedOrder,
    });
  }

  static toOrmWalletTransaction(
    tx: WalletTransaction
  ): WalletTransactionOrmEntity {
    const ormEntity = new WalletTransactionOrmEntity();
    ormEntity.id = tx.id;
    ormEntity.walletId = tx.walletId;
    ormEntity.type = tx.type;
    ormEntity.amount = tx.amount;
    ormEntity.status = tx.status;
    ormEntity.timestamp = tx.timestamp;
    ormEntity.note = tx.note;
    ormEntity.relatedOrder = tx.relatedOrder;

    return ormEntity;
  }

  static toPartialOrmWallet(
    payload: Partial<Wallet>
  ): Partial<WalletOrmEntity> {
    // Only map allowed updatable fields
    const partial: Partial<WalletOrmEntity> = {};
    if ("balance" in payload) partial.balance = payload.balance;
    if ("currency" in payload) partial.currency = payload.currency;
    if ("updatedAt" in payload) partial.updatedAt = payload.updatedAt;
    // etc: whitelist updatable fields
    return partial;
  }

    // --- Cart Mapping ---
  static toOrmCart(cart: Cart): CartOrmEntity {
    const ormEntity = new CartOrmEntity();
    ormEntity.id = cart.id;
    ormEntity.userId = cart.userId;
    ormEntity.total = cart.total;
    ormEntity.createdAt = cart.createdAt;
    ormEntity.updatedAt = cart.updatedAt;

    return ormEntity;
  }

  static toOrmCartItem(cartItem: CartItem): CartItemOrmEntity {
    const ormEntity = new CartItemOrmEntity();
    ormEntity.id = cartItem.id;
    ormEntity.courseId = cartItem.courseId;
    ormEntity.cartId = cartItem.cartId;
    ormEntity.addedAt = cartItem.addedAt;

    return ormEntity;
  }

  static toDomainCart(ormEntity: CartOrmEntity): Cart {
    const cartItems = ormEntity.items
      ? ormEntity.items.map((item) =>
          CartItem.fromPrimitives({
            id: item.id,
            courseId: item.courseId,
            cartId: item.cartId,
            addedAt: item.addedAt,
          })
        )
      : [];

    return Cart.fromPrimitives({
      id: ormEntity.id,
      userId: ormEntity.userId,
      items: cartItems,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  // ------ Wishlist Mapping -----------
  static toOrmWishlist(wishlist: Wishlist): WishlistOrmEntity {
    const ormEntity = new WishlistOrmEntity();
    ormEntity.id = wishlist.id;
    ormEntity.userId = wishlist.userId;
    ormEntity.total = wishlist.total;
    ormEntity.createdAt = wishlist.createdAt;
    ormEntity.updatedAt = wishlist.updatedAt;

    return ormEntity;
  }

  static toOrmWishlistItem(
    wishlistItem: WishlistItem
  ): WishlistItemOrmEntity {
    const ormEntity = new WishlistItemOrmEntity();
    ormEntity.id = wishlistItem.id;
    ormEntity.courseId = wishlistItem.courseId;
    ormEntity.wishlistId = wishlistItem.wishlistId;
    ormEntity.addedAt = wishlistItem.addedAt;

    return ormEntity;
  }

  static toDomainWishlist(ormEntity: WishlistOrmEntity): Wishlist {
    const wishlistItems = ormEntity.items
      ? ormEntity.items.map((item) =>
          WishlistItem.fromPrimitives({
            id: item.id,
            courseId: item.courseId,
            wishlistId: item.wishlistId,
            addedAt: item.addedAt,
          })
        )
      : [];

    return Wishlist.fromPrimitives({
      id: ormEntity.id,
      userId: ormEntity.userId,
      items: wishlistItems,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toInstructorStudentDomain(entity: InstructorStudentOrmEntity): InstructorStudent {
    return InstructorStudent.create({
      id: entity.id,
      instructorId: entity.instructorId,
      studentId: entity.studentId,
      firstCourseId: entity.firstCourseId ?? null,
      status:
        entity.status === RelationshipStatusOrm.ACTIVE
          ? RelationshipStatus.ACTIVE
          : RelationshipStatus.INACTIVE,
      createdAt: entity.createdAt,
    });
  }
}
